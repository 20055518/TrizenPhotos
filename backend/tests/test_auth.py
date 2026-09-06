import pytest

@pytest.mark.asyncio
async def test_admin_login(client):
    res = await client.post('/api/auth/login', json={
        'email': 'admin@trizen.com',
        'password': 'Admin@123'
    })
    assert res.status_code == 200
    data = res.json()
    assert 'access_token' in data
    assert data['user']['role'] == 'ADMIN'

@pytest.mark.asyncio
async def test_team_member_login(client):
    res = await client.post('/api/auth/login', json={
        'email': 'photographer@trizen.com',
        'password': 'Team@123'
    })
    assert res.status_code == 200
    data = res.json()
    assert 'access_token' in data
    assert data['user']['role'] == 'TEAM_MEMBER'

@pytest.mark.asyncio
async def test_invalid_login(client):
    res = await client.post('/api/auth/login', json={
        'email': 'admin@trizen.com',
        'password': 'WrongPassword999'
    })
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_get_current_user_me(client, admin_token):
    res = await client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {admin_token}'
    })
    assert res.status_code == 200
    assert res.json()['email'] == 'admin@trizen.com'
