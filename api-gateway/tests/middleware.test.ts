import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { authenticate, authorize } from '../src/middleware/auth';

const mockRes = (): jest.Mocked<Pick<Response, 'status' | 'json'>> & Response => {
  const res = {} as any;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides: Partial<Request> = {}): Request =>
  ({ headers: {}, ...overrides } as Request);

describe('authenticate middleware', () => {
  const secret = process.env.JWT_SECRET as string;

  it('calls next() with a valid token', () => {
    const token = jwt.sign({ id: '123', role: 'rider' }, secret);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: '123', role: 'rider' });
  });

  it('returns 401 when no token provided', () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    authenticate(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for invalid token', () => {
    const req = mockReq({ headers: { authorization: 'Bearer invalid.token.here' } });
    const res = mockRes();
    authenticate(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for expired token', () => {
    const token = jwt.sign({ id: '1', role: 'rider' }, secret, { expiresIn: -1 });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    authenticate(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token expired' }));
  });
});

describe('authorize middleware', () => {
  it('calls next() when role matches', () => {
    const req = mockReq();
    req.user = { id: '1', role: 'rider' };
    const res = mockRes();
    const next = jest.fn();

    authorize('rider')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when role does not match', () => {
    const req = mockReq();
    req.user = { id: '1', role: 'driver' };
    const res = mockRes();
    const next = jest.fn();

    authorize('rider')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows multiple roles', () => {
    const req = mockReq();
    req.user = { id: '1', role: 'driver' };
    const res = mockRes();
    const next = jest.fn();

    authorize('rider', 'driver')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
