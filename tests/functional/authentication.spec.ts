import { UserType } from '#auth/models/user'
import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('User - Register', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should register correctly', async ({ client }) => {
    const response = await client.post('/user/register').json({
      name: 'toto',
      address: '4 rue du moulin',
      city: 'Bagnolet',
      zipCode: '93170',
      type: UserType.CUSTOMER,
      email: 'totoo@exemple.com',
      password: 'totototo',
    })

    response.assertStatus(201)
  })

  test('should not register if already login', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/user/register')
      .json({
        name: 'toto',
        address: '4 rue du moulin',
        city: 'Bagnolet',
        zipCode: '93170',
        type: UserType.CUSTOMER,
        email: 'totoo@exemple.com',
        password: 'totototo',
      })
      .loginAs(user)

    response.assertBodyContains({
      code: 'E_UNAUTHORIZED',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
    response.assertStatus(401)
  })

  test('should not register with an existing email', async ({ client }) => {
    await UserFactory.merge({ email: 'totoo@exemple.com' }).create()

    const response = await client.post('/user/register').json({
      name: 'toto',
      address: '4 rue du moulin',
      city: 'Bagnolet',
      zipCode: '93170',
      type: UserType.CUSTOMER,
      email: 'totoo@exemple.com',
      password: 'totototo',
    })

    response.assertBodyContains({
      errors: [
        {
          message: 'The email has already been taken',
          rule: 'database.unique',
          field: 'email',
        },
      ],
    })
    response.assertStatus(422)
  })

  test('should not register with an invalid email', async ({ client }) => {
    const response = await client.post('/user/register').json({
      name: 'toto',
      address: '4 rue du moulin',
      city: 'Bagnolet',
      zipCode: '93170',
      type: UserType.CUSTOMER,
      email: 'totoexemple.com',
      password: 'totototo',
    })

    response.assertBodyContains({
      errors: [
        {
          message: 'The email field must be a valid email address',
          rule: 'email',
          field: 'email',
        },
      ],
    })
    response.assertStatus(422)
  })

  test('should not register with a short password', async ({ client }) => {
    const response = await client.post('/user/register').json({
      name: 'toto',
      address: '4 rue du moulin',
      city: 'Bagnolet',
      zipCode: '93170',
      type: UserType.CUSTOMER,
      email: 'totoexemple.com',
      password: 'toto',
    })

    response.assertBodyContains({
      errors: [
        {
          field: 'password',
          message: 'The password field must have at least 8 characters',
          rule: 'minLength',
        },
      ],
    })
    response.assertStatus(422)
  })

  test('should not register with a short name', async ({ client }) => {
    const response = await client.post('/user/register').json({
      name: 'to',
      address: '4 rue du moulin',
      city: 'Bagnolet',
      zipCode: '93170',
      type: UserType.CUSTOMER,
      email: 'toto@exemple.com',
      password: 'tototototo',
    })

    response.assertBodyContains({
      errors: [
        {
          field: 'name',
          message: 'The name field must have at least 3 characters',
          rule: 'minLength',
        },
      ],
    })
    response.assertStatus(422)
  })
})
test.group('User - Login', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should login correctly', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/user/login')
      .json({ email: user.email, password: 'totototo' })

    response.assertStatus(200)
  })

  test('should not login if incorrect password', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/user/login')
      .json({ email: user.email, password: 'invalidpass' })

    response.assertBodyContains({
      errors: [
        {
          message: 'Invalid user credentials',
        },
      ],
    })
    response.assertStatus(400)
  })

  test('should not login if incorrect email', async ({ client }) => {
    await UserFactory.create()

    const response = await client
      .post('/user/login')
      .json({ email: 'exemple@exemple.com', password: 'totototo' })

    response.assertBodyContains({
      errors: [
        {
          message: 'Invalid user credentials',
        },
      ],
    })
    response.assertStatus(400)
  })

  test('should not login if already login', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/user/login')
      .json({ email: user.email, password: 'totototo' })
      .loginAs(user)

    response.assertBodyContains({
      code: 'E_UNAUTHORIZED',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
    response.assertStatus(401)
  })
})
test.group('User - Logout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should logout correctly', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.delete('/logout').loginAs(user)

    response.assertStatus(200)
  })
  test('should not logout if not auth', async ({ client }) => {
    const response = await client.delete('/logout')

    response.assertBodyContains({
      code: 'E_UNAUTHORIZED',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
    response.assertStatus(401)
  })
})
