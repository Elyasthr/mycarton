import { UserType } from '#auth/models/user'
import Carton from '#cartons/models/carton'
import { CartonFactory } from '#database/factories/carton_factory'
import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Cartons - Add', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should add carton successfully for merchant user', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const response = await client
      .post('/cartons')
      .loginAs(user)
      .json({ cartons: [{ size: 'L', quantity: 1 }] })

    response.assertStatus(201)
  })

  test('should add multiple carton successfully for merchant user', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const response = await client
      .post('/cartons')
      .loginAs(user)
      .json({
        cartons: [
          { size: 'L', quantity: 3 },
          { size: 'M', quantity: 2 },
        ],
      })

    response.assertStatus(201)
  })

  test('should not add more than 100 carton', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const response = await client
      .post('/cartons')
      .loginAs(user)
      .json({
        cartons: [
          { size: 'L', quantity: 102 },
          { size: 'M', quantity: 2 },
        ],
      })

    response.assertStatus(422)
  })

  test('should not add less than 1 carton', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const response = await client
      .post('/cartons')
      .loginAs(user)
      .json({
        cartons: [
          { size: 'L', quantity: 102 },
          { size: 'M', quantity: 0 },
        ],
      })

    response.assertStatus(422)
  })

  test('should not add carton with invalid size', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const response = await client
      .post('/cartons')
      .loginAs(user)
      .json({
        cartons: [
          { size: 'Z', quantity: 102 },
          { size: 'M', quantity: 0 },
        ],
      })

    response.assertStatus(422)
  })

  test('should not add carton with invalid quantity', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const response = await client
      .post('/cartons')
      .loginAs(user)
      .json({
        cartons: [{ size: 'M', quantity: 'L' }],
      })

    response.assertStatus(422)
  })

  test('should not add carton with invalid data', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const response = await client.post('/cartons').loginAs(user).json({ size: 'Z' })

    response.assertStatus(422)
  })

  test('should not add carton for customer user', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const response = await client.post('/cartons').loginAs(user).json({ size: 'L' })

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
  })

  test('should not add carton without authentication', async ({ client }) => {
    const response = await client.post('/cartons').json({ size: 'L' })

    response.assertStatus(401)
    response.assertBodyContains({
      errors: [
        {
          message: 'Unauthorized access',
        },
      ],
    })
  })
})

test.group('Cartons - Delete', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should delete carton successfully for merchant user', async ({ client, assert }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const carton = await CartonFactory.merge({ merchantId: merchant.id }).create()

    const response = await client.delete(`/cartons/${carton.id}`).loginAs(merchant)

    response.assertStatus(200)

    const checkCarton = await Carton.find(carton.id)
    assert.isNull(checkCarton, 'Carton was not deleted')
  })

  test('should not delete carton for non-owner merchant user', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const otherMerchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const carton = await CartonFactory.merge({ merchantId: otherMerchant.id }).create()

    const response = await client.delete(`/cartons/${carton.id}`).loginAs(merchant)

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
  })

  test('should not delete carton for customer user', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const carton = await CartonFactory.merge({ merchantId: merchant.id }).create()

    const response = await client.delete(`/cartons/${carton.id}`).loginAs(customer)

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
  })

  test('should not delete carton without authentication', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const carton = await CartonFactory.merge({ merchantId: merchant.id }).create()

    const response = await client.delete(`/cartons/${carton.id}`)

    response.assertStatus(401)
    response.assertBodyContains({
      errors: [
        {
          message: 'Unauthorized access',
        },
      ],
    })
  })

  test('should not delete non-existent carton', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()

    const response = await client.delete('/cartons/999').loginAs(merchant)

    response.assertStatus(404)
  })

  test('should cascade delete cartons on user delete', async ({ assert }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const carton = await CartonFactory.merge({ merchantId: merchant.id }).create()

    await merchant.delete()

    const checkCarton = await Carton.find(carton.id)
    assert.isNull(checkCarton, 'Carton was not deleted after merchant was deleted')
  })
})

test.group('Cartons - View', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should return the specified carton by id', async ({ client }) => {
    const merchant = await UserFactory.create()
    const carton = await CartonFactory.create()

    const response = await client.get(`/cartons/${carton.id}`).loginAs(merchant)

    response.assertStatus(200)
    response.assertBodyContains({
      id: carton.id,
      merchantId: null,
      reservationId: null,
      size: carton.size,
      status: carton.status,
    })
  })

  test('should return error if invalid id', async ({ client }) => {
    const merchant = await UserFactory.create()

    const response = await client.get('/cartons/33').loginAs(merchant)

    response.assertStatus(404)
  })

  test('should not return the specified carton by id if not login', async ({ client }) => {
    const carton = await CartonFactory.create()

    const response = await client.get(`/cartons/${carton.id}`)

    response.assertStatus(401)
    response.assertBodyContains({
      errors: [
        {
          message: 'Unauthorized access',
        },
      ],
    })
  })
})

test.group('Cartons - List of cartons', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should return all cartons for a specified merchant', async ({ client, assert }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    await CartonFactory.merge({ merchantId: merchant.id }).createMany(5)

    const response = await client.get(`/merchant/${merchant.id}/cartons`).loginAs(customer)

    response.assertStatus(200)
    assert.equal(response.body().length, 5)
  })

  test('should not return cartons if not authenticate', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()

    await CartonFactory.merge({ merchantId: merchant.id }).createMany(5)

    const response = await client.get(`/merchant/${merchant.id}/cartons`)

    response.assertStatus(401)
    response.assertBodyContains({
      errors: [
        {
          message: 'Unauthorized access',
        },
      ],
    })
  })

  test('should not return cartons if not merchant id', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    await CartonFactory.merge({ merchantId: merchant.id }).createMany(5)

    const response = await client.get(`/merchant/${customer.id}/cartons`).loginAs(customer)

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'The specified user is not a merchant.',
    })
  })

  test('should not return cartons with invalid id', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    await CartonFactory.createMany(5)

    const response = await client.get('/merchant/230199/cartons').loginAs(customer)

    response.assertStatus(404)
  })
})
