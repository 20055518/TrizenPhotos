import os
import io
import uuid
from pathlib import Path
from datetime import datetime, timezone
from pymongo import MongoClient
from PIL import Image, ImageDraw, ImageFont
from app.config import settings
from app.services.auth_utils import hash_password
from app.models.user import UserRole

def create_sample_photo(title: str, subtitle: str, color1: tuple, color2: tuple, width=1200, height=800) -> bytes:
    img = Image.new('RGB', (width, height), color1)
    draw = ImageDraw.Draw(img)
    
    # Gradient-like bands
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * (y / height))
        g = int(color1[1] + (color2[1] - color1[1]) * (y / height))
        b = int(color1[2] + (color2[2] - color1[2]) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Artistic overlay shapes
    draw.rectangle([50, 50, width - 50, height - 50], outline=(255, 255, 255), width=3)
    draw.rectangle([65, 65, width - 65, height - 65], outline=(255, 215, 0), width=1)
    
    # Central decorative badge
    center_y = height // 2
    draw.rectangle([width//4, center_y - 90, 3*width//4, center_y + 90], fill=(0, 0, 0))
    draw.rectangle([width//4, center_y - 90, 3*width//4, center_y + 90], outline=(255, 215, 0), width=2)
    
    # Title & Subtitle text (fallback font)
    draw.text((width // 2, center_y - 30), title, fill=(255, 255, 255), anchor='mm')
    draw.text((width // 2, center_y + 25), subtitle, fill=(255, 223, 128), anchor='mm')
    draw.text((width // 2, height - 90), 'Arjun & Priya Wedding - TrizenAI Moments', fill=(240, 240, 240), anchor='mm')

    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=90)
    return buffer.getvalue()

def seed_database():
    print('Connecting to MongoDB for seeding...')
    client = MongoClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]

    # Clean existing seed records
    db.users.delete_many({'email': {'$in': ['admin@trizen.com', 'photographer@trizen.com']}})
    
    # 1. Create Demo Users
    admin_id = db.users.insert_one({
        'name': 'Pooja Sharma (Lead Admin)',
        'email': 'admin@trizen.com',
        'password_hash': hash_password('Admin@123'),
        'role': UserRole.ADMIN.value,
        'created_at': datetime.now(timezone.utc)
    }).inserted_id

    team_id = db.users.insert_one({
        'name': 'Rahul Verma (Photographer)',
        'email': 'photographer@trizen.com',
        'password_hash': hash_password('Team@123'),
        'role': UserRole.TEAM_MEMBER.value,
        'created_at': datetime.now(timezone.utc)
    }).inserted_id

    print('Seeded Admin: admin@trizen.com (pwd: Admin@123)')
    print('Seeded Team Member: photographer@trizen.com (pwd: Team@123)')

    # 2. Create Demo Event: Arjun & Priya Wedding
    db.events.delete_many({'name': 'Arjun & Priya Wedding'})
    event_doc = {
        'name': 'Arjun & Priya Wedding',
        'date': '2026-10-15',
        'location': 'Taj Palace Grand Ballroom, Mumbai',
        'description': 'Celebration ceremony and wedding reception photography of Arjun & Priya.',
        'created_by': str(admin_id),
        'assigned_team_ids': [str(team_id)],
        'created_at': datetime.now(timezone.utc)
    }
    event_id = db.events.insert_one(event_doc).inserted_id
    event_id_str = str(event_id)
    print(f'Seeded Event: Arjun & Priya Wedding (ID: {event_id_str})')

    # 3. Seed Sample Photos
    db.photos.delete_many({'event_id': event_id_str})
    event_dir = Path(settings.UPLOAD_DIR) / event_id_str
    thumb_dir = event_dir / 'thumbnails'
    os.makedirs(event_dir, exist_ok=True)
    os.makedirs(thumb_dir, exist_ok=True)

    samples = [
        ('Couple Entrance', 'Royal Grand Entry Under Sparklers', (30, 20, 60), (90, 40, 110), True),
        ('Varmala Ceremony', 'Exchange of Floral Garlands', (120, 30, 50), (200, 80, 80), True),
        ('Sangeet Performance', 'Family Dance & Musical Celebration', (20, 60, 90), (40, 130, 160), True),
        ('Mandap Rituals', 'Sacred Seven Pheras & Mangalsutra', (140, 70, 20), (220, 150, 60), True),
        ('Sunset Couple Portrait', 'Golden Hour Silhouette by the Lake', (160, 60, 20), (240, 140, 40), True),
        ('Ring Exchange Ceremony', 'Diamond Solitaire & Platinum Bands', (40, 40, 60), (100, 110, 150), True),
        ('Bridal Mehndi Details', 'Intricate Henna Patterns & Jewels', (60, 80, 40), (120, 160, 80), True),
        ('Groom Baraat Arrival', 'Dhol Beats & Procession Festive Vibes', (100, 30, 40), (190, 60, 70), True),
        ('Haldi Splash Moments', 'Turmeric Rituals with Friends & Family', (180, 130, 20), (250, 210, 50), False),
        ('Candid Family Smiles', 'Laughter during Dinner Celebrations', (30, 70, 80), (70, 140, 160), False),
        ('Venue Architecture', 'Grand Floral Decor & Chandelier Lights', (50, 30, 70), (120, 80, 150), False),
        ('Late Night Party', 'DJ Stage Dance Floor Fun', (20, 20, 40), (80, 30, 100), False)
    ]

    for title, subtitle, c1, c2, is_selected in samples:
        content = create_sample_photo(title, subtitle, c1, c2)
        unique_name = f'{uuid.uuid4().hex}.jpg'
        file_path = event_dir / unique_name
        thumb_path = thumb_dir / unique_name

        with open(file_path, 'wb') as f:
            f.write(content)

        img = Image.open(io.BytesIO(content))
        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
        img.save(thumb_path, quality=85)

        clean_orig = title.lower().replace(' ', '_') + '.jpg'
        db.photos.insert_one({
            'event_id': event_id_str,
            'uploaded_by': str(team_id),
            'uploaded_by_name': 'Rahul Verma',
            'filename': unique_name,
            'original_name': clean_orig,
            'storage_path': str(file_path),
            'url': f'/api/photos/file/{event_id_str}/{unique_name}',
            'thumbnail_url': f'/api/photos/file/{event_id_str}/thumbnails/{unique_name}',
            'file_size': len(content),
            'mime_type': 'image/jpeg',
            'is_selected_for_gallery': is_selected,
            'created_at': datetime.now(timezone.utc)
        })

    print(f'Seeded {len(samples)} photos (8 curated for published gallery).')

    # 4. Create Demo Gallery per operational state:
    # URL: /gallery/abc123
    # Access PIN: 482917
    db.galleries.delete_many({'slug': 'abc123'})
    db.galleries.delete_many({'event_id': event_id_str})
    
    db.galleries.insert_one({
        'event_id': event_id_str,
        'slug': 'abc123',
        'pin_hash': hash_password('482917'),
        'is_published': True,
        'published_at': datetime.now(timezone.utc),
        'created_at': datetime.now(timezone.utc)
    })

    print('Seeded Gallery: /gallery/abc123 with Access PIN: 482917')
    print('Seeding completed successfully!')

if __name__ == '__main__':
    seed_database()
