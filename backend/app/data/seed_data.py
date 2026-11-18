"""
KisanAI Database Seed Script
Populates disease and crop data from PlantVillage labels.

Usage:
    cd backend
    python -m app.data.seed_data
"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import AsyncSessionLocal
from app.models.models import Crop, Disease, Treatment

# PlantVillage class structure:
# (crop_name, disease_name, model_label, is_healthy, symptoms, causes, prevention)
PLANTVILLAGE_DATA = [
    ("Apple", "Apple Scab", "Apple___Apple_scab", False,
     "Olive-green to brown velvety spots on leaves and fruit surface.",
     "Fungal infection (Venturia inaequalis) favored by cool wet spring weather.",
     "Plant resistant varieties, remove fallen leaves, improve canopy airflow."),
    ("Apple", "Black Rot", "Apple___Black_rot", False,
     "Circular lesions with purple borders and brown centers on leaves; mummified fruits.",
     "Fungal infection (Botryosphaeria obtusa); spreads through wounds and mummified fruit.",
     "Prune dead wood, remove mummified fruit, maintain tree vigor."),
    ("Apple", "Cedar Apple Rust", "Apple___Cedar_apple_rust", False,
     "Bright orange-yellow spots on leaves; tube-like structures on undersides.",
     "Fungal rust requiring both apple and juniper/cedar as hosts.",
     "Remove nearby juniper hosts if feasible; plant resistant varieties."),
    ("Apple", "Healthy", "Apple___healthy", True, None, None, None),
    ("Blueberry", "Healthy", "Blueberry___healthy", True, None, None, None),
    ("Cherry", "Powdery Mildew", "Cherry_(including_sour)___Powdery_mildew", False,
     "White powdery coating on young leaves and shoots.",
     "Fungal infection favored by warm days and cool nights with high humidity.",
     "Improve airflow, avoid excess nitrogen, plant resistant varieties."),
    ("Cherry", "Healthy", "Cherry_(including_sour)___healthy", True, None, None, None),
    ("Corn (Maize)", "Cercospora Leaf Spot / Gray Leaf Spot",
     "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", False,
     "Rectangular gray-tan lesions parallel to leaf veins.",
     "Fungal infection (Cercospora zeae-maydis) favored by warm humid weather.",
     "Use resistant hybrids, crop rotation, reduce crop residue."),
    ("Corn (Maize)", "Common Rust", "Corn_(maize)___Common_rust_", False,
     "Small cinnamon-brown pustules on both leaf surfaces.",
     "Fungal rust (Puccinia sorghi) in cool moist weather.",
     "Use resistant hybrids; for severe cases consult local agricultural department."),
    ("Corn (Maize)", "Northern Leaf Blight", "Corn_(maize)___Northern_Leaf_Blight", False,
     "Large tan cigar-shaped lesions on leaves with dark margins.",
     "Fungal infection (Exserohilum turcicum) in cool moist conditions.",
     "Resistant hybrids, crop rotation, reduce surface residue."),
    ("Corn (Maize)", "Healthy", "Corn_(maize)___healthy", True, None, None, None),
    ("Grape", "Black Rot", "Grape___Black_rot", False,
     "Brown lesions on leaves with black margins; black shriveled berries.",
     "Fungal infection (Guignardia bidwellii) during warm wet weather.",
     "Remove mummified berries, improve canopy management, avoid overhead irrigation."),
    ("Grape", "Esca (Black Measles)", "Grape___Esca_(Black_Measles)", False,
     "Tiger-stripe pattern on leaves, internal wood discoloration, berry spotting.",
     "Complex fungal trunk disease; favored by drought stress.",
     "Prune during dry weather, disinfect pruning tools, protect wounds."),
    ("Grape", "Leaf Blight (Isariopsis Leaf Spot)",
     "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", False,
     "Dark brown irregular lesions on leaves, often with yellow halos.",
     "Fungal infection favored by wet humid conditions.",
     "Improve canopy airflow, remove infected material."),
    ("Grape", "Healthy", "Grape___healthy", True, None, None, None),
    ("Orange", "Haunglongbing (Citrus Greening)",
     "Orange___Haunglongbing_(Citrus_greening)", False,
     "Asymmetric yellowing (blotchy mottle) on leaves; lopsided bitter fruit.",
     "Bacterial disease (Candidatus Liberibacter) spread by Asian citrus psyllid. No cure.",
     "Control psyllid populations, remove and destroy infected trees, plant certified disease-free nursery stock."),
    ("Peach", "Bacterial Spot", "Peach___Bacterial_spot", False,
     "Small angular water-soaked spots on leaves that turn dark; fruit lesions and cracking.",
     "Bacterial infection (Xanthomonas arboricola) spread by rain and wind.",
     "Plant resistant varieties, avoid overhead irrigation."),
    ("Peach", "Healthy", "Peach___healthy", True, None, None, None),
    ("Bell Pepper", "Bacterial Spot", "Pepper,_bell___Bacterial_spot", False,
     "Small water-soaked spots on leaves and fruit turning dark and scabby.",
     "Bacterial infection (Xanthomonas) spread by rain splash.",
     "Use certified seed, avoid overhead irrigation, crop rotation."),
    ("Bell Pepper", "Healthy", "Pepper,_bell___healthy", True, None, None, None),
    ("Potato", "Early Blight", "Potato___Early_blight", False,
     "Dark brown concentric-ringed spots on older leaves; leaves yellow and drop.",
     "Fungal infection (Alternaria solani) in warm weather with alternating wet/dry periods.",
     "Crop rotation, remove infected material, improve drainage, balanced fertilization."),
    ("Potato", "Late Blight", "Potato___Late_blight", False,
     "Water-soaked lesions turning brown-black; white sporulation in humid conditions; tuber rot.",
     "Oomycete (Phytophthora infestans) in cool wet conditions; spreads very rapidly.",
     "Plant certified seed tubers, resistant varieties, improve drainage, remove infected plants promptly."),
    ("Potato", "Healthy", "Potato___healthy", True, None, None, None),
    ("Raspberry", "Healthy", "Raspberry___healthy", True, None, None, None),
    ("Soybean", "Healthy", "Soybean___healthy", True, None, None, None),
    ("Squash", "Powdery Mildew", "Squash___Powdery_mildew", False,
     "White powdery growth on leaf surfaces; leaves may yellow and die.",
     "Fungal infection (Podosphaera xanthii) in warm conditions with moderate humidity.",
     "Improve airflow, remove infected material, avoid excess nitrogen."),
    ("Strawberry", "Leaf Scorch", "Strawberry___Leaf_scorch", False,
     "Small purple to dark brown spots on leaves; centers turn tan-gray; leaves appear scorched.",
     "Fungal infection (Diplocarpon earlianum) in warm moist conditions.",
     "Remove infected leaves, avoid overhead irrigation, improve plant spacing."),
    ("Strawberry", "Healthy", "Strawberry___healthy", True, None, None, None),
    ("Tomato", "Bacterial Spot", "Tomato___Bacterial_spot", False,
     "Small water-soaked spots on leaves, stems, and fruit turning dark and irregular.",
     "Bacterial infection (Xanthomonas) spread by rain splash and irrigation.",
     "Use certified disease-free seed, avoid overhead irrigation, crop rotation."),
    ("Tomato", "Early Blight", "Tomato___Early_blight", False,
     "Dark brown concentric-ringed spots on older leaves; yellow halo surrounding spots; defoliation in severe cases.",
     "Fungal infection (Alternaria solani) favored by warm temperatures 24-29°C and alternating wet/dry periods.",
     "Remove infected leaves, crop rotation (avoid Solanaceae for 2-3 seasons), adequate spacing, mulch, drip irrigation."),
    ("Tomato", "Late Blight", "Tomato___Late_blight", False,
     "Water-soaked lesions on leaves turning brown-black; white sporulation on undersides; rapid collapse in cool wet weather.",
     "Oomycete (Phytophthora infestans) in cool 10-20°C wet conditions; spreads catastrophically fast.",
     "Plant resistant varieties, improve drainage, remove infected plants, avoid leaf wetness."),
    ("Tomato", "Leaf Mold", "Tomato___Leaf_Mold", False,
     "Pale yellow spots on upper leaf surface; olive-green velvety growth on underside.",
     "Fungal infection (Passalora fulva) in high humidity; common in greenhouses.",
     "Reduce humidity, improve ventilation, avoid overhead watering."),
    ("Tomato", "Septoria Leaf Spot", "Tomato___Septoria_leaf_spot", False,
     "Small circular spots with dark borders and gray-white centers; tiny black dots in center; starts on lower leaves.",
     "Fungal infection (Septoria lycopersici) in warm wet conditions.",
     "Avoid overhead irrigation, remove infected material, crop rotation."),
    ("Tomato", "Spider Mites (Two-spotted Spider Mite)",
     "Tomato___Spider_mites Two-spotted_spider_mite", False,
     "Fine stippling on leaves, bronzing; fine webbing on undersides; leaves drop in severe cases.",
     "Arachnid pest (Tetranychus urticae) worse in hot dry conditions.",
     "Improve plant water status, increase humidity, encourage natural predators."),
    ("Tomato", "Target Spot", "Tomato___Target_Spot", False,
     "Brown circular to irregular lesions with concentric rings resembling a target; affects all above-ground parts.",
     "Fungal infection (Corynespora cassiicola) in warm humid conditions.",
     "Improve airflow, avoid overhead irrigation, remove infected debris."),
    ("Tomato", "Yellow Leaf Curl Virus",
     "Tomato___Tomato_Yellow_Leaf_Curl_Virus", False,
     "Yellowing and upward curling of leaves; stunted plants; flower drop; reduced fruit set.",
     "Viral disease spread by whiteflies (Bemisia tabaci).",
     "Control whitefly populations, use reflective mulch, remove infected plants, plant resistant varieties."),
    ("Tomato", "Tomato Mosaic Virus", "Tomato___Tomato_mosaic_virus", False,
     "Mosaic pattern of light and dark green; leaf distortion; fruit discoloration.",
     "Viral disease spread mechanically and by aphids.",
     "Remove infected plants, wash hands and tools, control aphids."),
    ("Tomato", "Healthy", "Tomato___healthy", True, None, None, None),
]


async def seed_database():
    """Seed crop and disease data into database."""
    print("=" * 50)
    print("KisanAI Database Seeding")
    print("=" * 50)

    async with AsyncSessionLocal() as session:
        crops_map = {}
        diseases_created = 0

        for crop_name, disease_name, model_label, is_healthy, symptoms, causes, prevention in PLANTVILLAGE_DATA:
            # Get or create crop
            if crop_name not in crops_map:
                crop = Crop(name=crop_name)
                session.add(crop)
                await session.flush()
                crops_map[crop_name] = crop.id
                print(f"  ✓ Crop: {crop_name}")

            crop_id = crops_map[crop_name]
            disease = Disease(
                crop_id=crop_id,
                name=disease_name,
                model_class_label=model_label,
                is_healthy=is_healthy,
                symptoms=symptoms,
                causes=causes,
                prevention=prevention,
            )
            session.add(disease)
            diseases_created += 1

        await session.commit()
        print(f"\n✅ Seeded: {len(crops_map)} crops, {diseases_created} diseases")
        print("\n⚠️  NOTE: To add treatment data, run the treatment import script.")


if __name__ == "__main__":
    asyncio.run(seed_database())
