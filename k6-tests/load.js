import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
  ],
  ext: {
    loadimpact: {
      projectID: 5334500,
      name: 'Pruebas de Carga API Auth'
    }
  }
};
function generateUniqueUser(iterationId) {
  return {
    name: `TestUser${iterationId}`,
    email: `test${iterationId}@example.com`,
    password: 'password123'
  };
}

export default function () {
  const userData = generateUniqueUser(__VU);

  const registerPayload = JSON.stringify({
    name: userData.name,
    email: userData.email,
    password: userData.password
  });

  const registerResponse = http.post('http://localhost:3000/api/register', registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(registerResponse, {
    'registro status 201': (r) => r.status === 201,
    'registro tiene datos de usuario': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data.user.email === userData.email;
    }
  });

  const loginPayload = JSON.stringify({
    email: userData.email,
    password: userData.password
  });

  const loginResponse = http.post('http://localhost:3000/api/login', loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginResponse, {
    'login status 200': (r) => r.status === 200,
    'login tiene token': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data.token !== undefined;
    }
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'k6-report.json': JSON.stringify(data)
  };
}