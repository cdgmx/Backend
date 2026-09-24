const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');
const mongoose = require('mongoose');
const express = require('express');
process.env.JWT_SECRET = 'offline-fixture-only-secret-with-more-than-32-characters';
process.env.NODE_ENV = 'production';
const generateToken = require('../utils/GenerateToken');
const User = require('../models/UserModel');

// No application entrypoint or dotenv file is loaded; database methods below
// are replaced explicitly, and all HTTP traffic stays on loopback.
test('token generation verifies identity and rejects another signing key', () => {
 const token = generateToken('fixture-user');
 assert.equal(jwt.verify(token, process.env.JWT_SECRET).id, 'fixture-user');
 assert.throws(() => jwt.verify(token, 'wrong-key'));
});
test('model validation and password comparison require no database', async () => {
 const user = new User({first_name:'Test', last_name:'User', email_address:'fixture@example.invalid', password:await bcrypt.hash('fixture-password', 4)});
 await user.validate();
 assert.equal(await user.matchPassword('fixture-password'), true);
 assert.equal(await user.matchPassword('incorrect-password'), false);
 assert.equal(mongoose.connection.readyState, 0);
});
test('cookie serialization rejects injected cookie names', () => {
 assert.match(cookie.serialize('token', 'fixture', {httpOnly:true, sameSite:'strict', secure:true}), /HttpOnly/);
 assert.throws(() => cookie.serialize('invalid;name', 'fixture'));
});
test('actual login, duplicate registration and logout routes preserve responses', async () => {
 const originalFindOne = User.findOne;
 const originalCreate = User.create;
 User.findOne = async ({email_address}) => email_address === 'fixture@example.invalid' ? {
  _id:'fixture-user', first_name:'Test', last_name:'User', email_address,
  matchPassword:async value => value === 'fixture-password'
 } : null;
 User.create = async () => { throw new Error('Unexpected database write'); };
 const app = express(); app.use(express.json()); app.use('/api/users', require('../routes/UserRoutes'));
 const {NotFound, ErrorHandler} = require('../middlewares/ErrorMiddleware'); app.use(NotFound); app.use(ErrorHandler);
 const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
 const base = `http://127.0.0.1:${server.address().port}/api/users`;
 const post = (path, body) => fetch(base+path, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body)});
 try {
  let response = await post('/login', {email_address:'fixture@example.invalid', password:'fixture-password'});
  assert.equal(response.status,200); assert.equal(jwt.verify((await response.json()).token,process.env.JWT_SECRET).id,'fixture-user');
  response = await post('/login',{email_address:'fixture@example.invalid',password:'wrong'}); assert.equal(response.status,400);
  response = await post('',{email_address:'fixture@example.invalid',password:'fixture-password'}); assert.equal(response.status,400); assert.equal((await response.json()).message,'User Already Exists');
  response = await fetch(base+'/logout',{method:'DELETE'}); assert.equal(response.status,200); assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal(mongoose.connection.readyState,0);
 } finally { User.findOne=originalFindOne; User.create=originalCreate; await new Promise(resolve => server.close(resolve)); }
});
