"""
KisanAI Plant Disease Model Training Script
MobileNetV2 Transfer Learning on PlantVillage Dataset

Usage:
    python train_model.py --data_dir /path/to/PlantVillage --epochs 20

Dataset: PlantVillage (https://github.com/spMohanty/PlantVillage-Dataset)
Or use tf_flowers / kaggle plantvillage datasets.
"""
import argparse
import json
import os
import shutil
from pathlib import Path

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix


def build_model(num_classes: int, img_size: int = 224):
    """Build MobileNetV2 transfer learning model."""
    import tensorflow as tf
    from tensorflow.keras import layers, Model
    from tensorflow.keras.applications import MobileNetV2

    base_model = MobileNetV2(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights="imagenet",
    )
    # Freeze base initially
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(img_size, img_size, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = Model(inputs, outputs)
    return model, base_model


def create_data_generators(data_dir: str, img_size: int = 224, batch_size: int = 32):
    """Create training and validation data generators."""
    import tensorflow as tf
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    train_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.1,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=False,
        brightness_range=[0.8, 1.2],
        validation_split=0.2,
    )

    train_gen = train_datagen.flow_from_directory(
        data_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )

    val_gen = train_datagen.flow_from_directory(
        data_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )

    return train_gen, val_gen


def train(data_dir: str, output_dir: str, epochs: int = 20, batch_size: int = 32, img_size: int = 224):
    import tensorflow as tf
    from tensorflow.keras.callbacks import (
        ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard
    )

    print(f"\n{'='*60}")
    print("KisanAI Plant Disease Model Training")
    print(f"{'='*60}")
    print(f"Data directory : {data_dir}")
    print(f"Output directory: {output_dir}")
    print(f"Epochs         : {epochs}")
    print(f"Image size     : {img_size}x{img_size}")
    print(f"TensorFlow     : {tf.__version__}")
    print(f"{'='*60}\n")

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Data generators
    train_gen, val_gen = create_data_generators(data_dir, img_size, batch_size)
    num_classes = len(train_gen.class_indices)

    print(f"Found {num_classes} disease classes")
    print(f"Training samples  : {train_gen.samples}")
    print(f"Validation samples: {val_gen.samples}\n")

    # Save class labels
    # Format: index -> "CropName___DiseaseName" (PlantVillage convention)
    class_labels = {v: k for k, v in train_gen.class_indices.items()}
    class_labels_list = [class_labels[i] for i in range(num_classes)]
    labels_path = output_path / "class_labels.json"
    with open(labels_path, "w") as f:
        json.dump(class_labels_list, f, indent=2)
    print(f"Saved class labels to {labels_path}")

    # Build model
    model, base_model = build_model(num_classes, img_size)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()

    # Callbacks
    model_path = output_path / "plant_disease_model.h5"
    callbacks = [
        ModelCheckpoint(
            str(model_path),
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=3, min_lr=1e-6),
    ]

    # Phase 1: Train head only
    print("\n--- Phase 1: Training classification head ---")
    history1 = model.fit(
        train_gen,
        epochs=min(10, epochs),
        validation_data=val_gen,
        callbacks=callbacks,
    )

    # Phase 2: Fine-tune top layers of base
    print("\n--- Phase 2: Fine-tuning top layers ---")
    base_model.trainable = True
    # Freeze all but top 30 layers
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    remaining_epochs = max(0, epochs - 10)
    if remaining_epochs > 0:
        history2 = model.fit(
            train_gen,
            epochs=remaining_epochs,
            validation_data=val_gen,
            callbacks=callbacks,
        )

    # Evaluate
    print("\n--- Evaluation on validation set ---")
    val_gen.reset()
    y_pred_probs = model.predict(val_gen, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = val_gen.classes[:len(y_pred)]

    report = classification_report(
        y_true, y_pred,
        target_names=class_labels_list,
        output_dict=True,
    )

    # Save evaluation report
    eval_path = output_path / "evaluation_report.json"
    with open(eval_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nClassification Report saved to {eval_path}")
    print(f"\nOverall Accuracy: {report['accuracy']:.4f}")
    print(f"Macro F1-Score  : {report['macro avg']['f1-score']:.4f}")
    print(f"\nModel saved to: {model_path}")
    print("\n⚠️  NOTE: PlantVillage performance may not reflect real-world field accuracy.")
    print("   Evaluate separately on field-collected images before deployment.")

    return str(model_path), str(labels_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train KisanAI Plant Disease Model")
    parser.add_argument("--data_dir", required=True, help="Path to PlantVillage dataset directory")
    parser.add_argument("--output_dir", default="./app/ml/saved_models", help="Output directory")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--img_size", type=int, default=224, help="Image size")
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        img_size=args.img_size,
    )
