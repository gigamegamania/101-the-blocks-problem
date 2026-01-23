import request from 'supertest';
import app from '../src/server.js';

describe('POST /blocks/solve', () => {
  it('should return 200 OK with solution', async () => {
    const input = `5
move 2 over 1
move 3 over 2
pile 1 onto 0
quit`;
    const response = await request(app).post('/blocks/solve').send({ text: input }).expect(200);

    expect(response.body).toHaveProperty('solution');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(typeof response.body.solution).toBe('string');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.solution).toBe(
      `
0: 0 1 2 3
1: 
2: 
3: 
4: 4
`.trim(),
    );
  });

  it('should return 200 OK for another solution', async () => {
    const input = `
5
move 1 over 0
move 2 over 1
move 1 over 3
quit`.trim();
    const response = await request(app).post('/blocks/solve').send({ text: input }).expect(200);

    expect(response.body).toHaveProperty('solution');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(typeof response.body.solution).toBe('string');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.solution).toBe(
      `
0: 0
1: 
2: 2
3: 3 1
4: 4
`.trim(),
    );
  });

  it('should return 200 OK for another solution with pile onto', async () => {
    const input = `
5
move 1 over 0
move 2 over 1
move 4 over 3
pile 0 onto 3
quit`.trim();
    const response = await request(app).post('/blocks/solve').send({ text: input }).expect(200);

    expect(response.body).toHaveProperty('solution');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(typeof response.body.solution).toBe('string');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.solution).toBe(
      `
0: 
1: 
2: 
3: 3 0 1 2
4: 4
`.trim(),
    );
  });

  it('should return 200 OK for another solution with pile over', async () => {
    const input = `5
move 1 over 0
move 2 over 1
move 4 over 3
pile 0 over 3
quit`.trim();
    const response = await request(app).post('/blocks/solve').send({ text: input }).expect(200);

    expect(response.body).toHaveProperty('solution');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(typeof response.body.solution).toBe('string');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.solution).toBe(
      `0: 
1: 
2: 
3: 3 4 0 1 2
4: `,
    );
  });

  it('should return JSON content type', async () => {
    const input = `4
move 3 onto 1
quit`;
    let response = await request(app)
      .post('/blocks/solve')
          .send({ text: input });

    expect(response.headers['content-type']).toMatch(/json/);
  });

  it('should return 400 for invalid input', async () => {
    const response = await request(app).post('/blocks/solve').send({}).expect(400);

    expect(response.body).toHaveProperty('error');
  });

  describe('blocks', () => {
    it('should return 500 for out of range block number', async () => {
      const input = `4
move 5 onto 1
quit`;
      const response = await request(app).post('/blocks/solve').send({ text: input }).expect(500);

      expect(response.body).toHaveProperty('error');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.error).toMatch(/Block number out of range/);
    });
  });
});
