async function testLogin() {
    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usn: '333cs21002',
                password: 'password123',
                role: 'student'
            })
        });
        const data = await response.text();
        console.log('STATUS:', response.status);
        console.log('RESPONSE:', data);
    } catch (error) {
        console.log('ERROR:', error);
    }
}

testLogin();
