async function test() {
    try {
        const loginRes = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usn: 'alfa21001', password: 'password123', role: 'student' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        
        const res = await fetch('http://localhost:8080/api/reservations/my-reservations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Reservations Status:', res.status);
        console.log('Reservations Data:', await res.text());

    } catch (e) {
        console.error(e);
    }
}
test();
