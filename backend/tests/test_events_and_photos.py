import pytest
import io
from app.database import get_database

@pytest.mark.asyncio
async def test_admin_list_events(client, admin_token):
    res = await client.get('/api/events', headers={
        'Authorization': f'Bearer {admin_token}'
    })
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1
    assert any(e['name'] == 'Arjun & Priya Wedding' for e in events)

@pytest.mark.asyncio
async def test_team_member_list_assigned_events(client, team_token):
    res = await client.get('/api/events', headers={
        'Authorization': f'Bearer {team_token}'
    })
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1

@pytest.mark.asyncio
async def test_team_member_blocked_from_publishing(client, team_token):
    db = get_database()
    event = await db.events.find_one({'name': 'Arjun & Priya Wedding'})
    event_id = str(event['_id'])

    # Team member attempting to publish gallery MUST receive 403 Forbidden
    res = await client.post(f'/api/galleries/publish/{event_id}', json={
        'pin': '123456'
    }, headers={
        'Authorization': f'Bearer {team_token}'
    })
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_team_member_cannot_modify_photo_selection(client, team_token):
    res = await client.patch('/api/photos/selection', json={
        'photo_ids': ['dummy'],
        'is_selected': True
    }, headers={
        'Authorization': f'Bearer {team_token}'
    })
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_upload_photo(client, team_token):
    db = get_database()
    event = await db.events.find_one({'name': 'Arjun & Priya Wedding'})
    event_id = str(event['_id'])

    file_content = b'\xff\xd8\xff\xe0\x00\x10JFIF' + b'\x00' * 50  # minimal mock JPEG bytes
    files = {
        'files': ('test_upload.jpg', io.BytesIO(file_content), 'image/jpeg')
    }
    res = await client.post(
        '/api/photos/upload',
        data={'event_id': event_id},
        files=files,
        headers={'Authorization': f'Bearer {team_token}'}
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]['event_id'] == event_id
