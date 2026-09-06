import pytest
from app.database import get_database

@pytest.mark.asyncio
async def test_public_gallery_info(client):
    res = await client.get('/api/galleries/public/abc123/info')
    assert res.status_code == 200
    data = res.json()
    assert data['slug'] == 'abc123'
    assert data['event_name'] == 'Arjun & Priya Wedding'
    assert data['requires_pin'] is True
    # Verify sensitive data is not leaked
    assert 'pin' not in data
    assert 'pin_hash' not in data
    assert 'photos' not in data

@pytest.mark.asyncio
async def test_verify_pin_incorrect(client):
    res = await client.post('/api/galleries/public/abc123/verify', json={
        'pin': '000000'
    })
    assert res.status_code == 401
    assert 'Incorrect PIN' in res.json()['detail']

@pytest.mark.asyncio
async def test_verify_pin_correct_and_curated_photos_only(client):
    # Correct PIN for demo gallery is 482917
    res = await client.post('/api/galleries/public/abc123/verify', json={
        'pin': '482917'
    })
    assert res.status_code == 200
    data = res.json()
    assert 'gallery_token' in data
    assert data['event_name'] == 'Arjun & Priya Wedding'
    photos = data['photos']
    assert len(photos) > 0

    # Ensure EVERY photo in the customer response is selected for gallery
    for p in photos:
        assert p['is_selected_for_gallery'] is True

@pytest.mark.asyncio
async def test_protected_gallery_photos_endpoint(client):
    # Without token -> 401
    res = await client.get('/api/galleries/public/abc123/photos')
    assert res.status_code == 401

    # Verify PIN to get token
    auth_res = await client.post('/api/galleries/public/abc123/verify', json={
        'pin': '482917'
    })
    token = auth_res.json()['gallery_token']

    # With token -> 200
    res = await client.get('/api/galleries/public/abc123/photos', headers={
        'X-Gallery-Token': token
    })
    assert res.status_code == 200
    assert len(res.json()) > 0
