import { UserType } from '#auth/models/user'
import Carton, { CartonSize, CartonStatus } from '#cartons/models/carton'
import { CartonFactory } from '#database/factories/carton_factory'
import { ReservationFactory } from '#database/factories/reservation_factory'
import { UserFactory } from '#database/factories/user_factory'
import Reservation, { ReservationStatus } from '#reservations/models/reservation'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Reservations - View', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should return the specified reservation by id', async ({ client }) => {
    const user = await UserFactory.create()
    const reservation = await ReservationFactory.create()

    const response = await client.get(`/reservations/${reservation.id}`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      customerId: null,
      id: reservation.id,
      status: reservation.status,
    })
  })

  test('should return error if invalid id', async ({ client }) => {
    const merchant = await UserFactory.create()

    const response = await client.get('/reservations/33').loginAs(merchant)

    response.assertStatus(404)
  })

  test('should not return the specified reservation by id if not login', async ({ client }) => {
    const reservation = await ReservationFactory.create()

    const response = await client.get(`/reservations/${reservation.id}`)

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

test.group('Reservations - List of reservations', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should return all reservations for a specified merchant', async ({ client, assert }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    await ReservationFactory.merge({ customerId: customer.id }).createMany(5)

    const response = await client.get(`/customer/${customer.id}/reservations`).loginAs(merchant)

    response.assertStatus(200)
    assert.equal(response.body().length, 5)
  })

  test('should not return reservations if not authenticate', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    await ReservationFactory.merge({ customerId: customer.id }).createMany(5)

    const response = await client.get(`/customer/${customer.id}/reservations`)

    response.assertStatus(401)
    response.assertBodyContains({
      errors: [
        {
          message: 'Unauthorized access',
        },
      ],
    })
  })

  test('should not return reservations if not merchant id', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    await ReservationFactory.merge({ customerId: customer.id }).createMany(5)

    const response = await client.get(`/customer/${merchant.id}/reservations`).loginAs(customer)

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'The specified user is not a customer.',
    })
  })

  test('should not return reservations with invalid id', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    await ReservationFactory.createMany(5)

    const response = await client.get('/merchant/230199/reservations').loginAs(customer)

    response.assertStatus(404)
  })
})

test.group('Reservations - Canceled', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should canceled reservation successfully for customer user', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const reservation = await ReservationFactory.merge({ customerId: customer.id }).create()
    const cartons = await CartonFactory.merge({
      reservationId: reservation.id,
      status: CartonStatus.RESERVED,
    }).createMany(2)

    const response = await client.post(`/reservations/${reservation.id}/canceled`).loginAs(customer)

    response.assertStatus(200)

    const checkReservation = await Reservation.findOrFail(reservation.id)
    assert.equal(checkReservation.status, 'CANCELED', 'Reservation was not canceled')

    const updatedCartons = await Carton.query().whereIn(
      'id',
      cartons.map(({ id }) => id)
    )

    assert.isTrue(
      updatedCartons.every((carton) => carton.status === CartonStatus.INSTOCK),
      'Not all cartons were set to INSTOCK'
    )
    assert.isTrue(
      updatedCartons.every((carton) => carton.reservationId === null),
      'Cartons are still associated with the reservation'
    )
  })

  test('should not canceled reservation for non-owner customer user', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const otherCustomer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const reservation = await ReservationFactory.merge({
      customerId: otherCustomer.id,
    }).create()

    const response = await client.post(`/reservations/${reservation.id}/canceled`).loginAs(customer)

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
  })

  test('should not canceled reservation for merchant user', async ({ client }) => {
    const merchant = await UserFactory.merge({ type: UserType.MERCHANT }).create()
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const reservation = await ReservationFactory.merge({ customerId: customer.id }).create()

    const response = await client.post(`/reservations/${reservation.id}/canceled`).loginAs(merchant)

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
  })

  test('should not canceled reservation without authentication', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const reservation = await ReservationFactory.merge({ customerId: customer.id }).create()

    const response = await client.post(`/reservations/${reservation.id}/canceled`)

    response.assertStatus(401)
    response.assertBodyContains({
      errors: [
        {
          message: 'Unauthorized access',
        },
      ],
    })
  })

  test('should not canceled non-existent reservation', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    const response = await client.post('/reservation/999/canceled').loginAs(customer)

    response.assertStatus(404)
  })

  test('should cascade canceled reservations on user delete', async ({ assert }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    const reservations = await ReservationFactory.merge({ customerId: customer.id }).createMany(2)

    await customer.delete()
    const deletedReservations = await Reservation.findMany(reservations.map(({ id }) => id))

    assert.equal(deletedReservations.length, 0)
  })
})

test.group('Reservations - Add', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create reservation and update carton status for customer user', async ({
    client,
    assert,
  }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()
    await CartonFactory.merge({ size: CartonSize.L }).createMany(20)
    await CartonFactory.merge({ size: CartonSize.M }).createMany(5)

    const response = await client
      .post('/reservations')
      .loginAs(customer)
      .json({
        cartons: [
          { size: 'L', quantity: 10 },
          { size: 'M', quantity: 2 },
        ],
      })

    response.assertStatus(201)

    const reservation = await Reservation.query().where('customerId', customer.id).firstOrFail()
    assert.equal(reservation.status, ReservationStatus.RESERVED)

    const updatedCartons = await Carton.query().where('reservationId', reservation.id)

    updatedCartons.forEach((carton) => {
      assert.equal(carton.status, CartonStatus.RESERVED)
      assert.equal(carton.reservationId, reservation.id)
    })
  })

  test('should not create reservation if not authenticated', async ({ client }) => {
    await CartonFactory.merge({ size: CartonSize.L }).createMany(20)
    await CartonFactory.merge({ size: CartonSize.M }).createMany(5)

    const response = await client.post('/reservations').json({
      cartons: [
        { size: 'L', quantity: 10 },
        { size: 'M', quantity: 2 },
      ],
    })

    response.assertStatus(401)
    response.assertBodyContains({
      errors: [
        {
          message: 'Unauthorized access',
        },
      ],
    })
  })

  test('should deny access for non-customer users', async ({ client }) => {
    const user = await UserFactory.merge({ type: UserType.MERCHANT }).create()

    const response = await client.post('/reservations').loginAs(user)

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_FORBIDDEN',
      message: 'Access Denied. You do not have permission to access this resource.',
    })
  })

  test('should not create reservation if more than 15 cartons reserved', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    const response = await client
      .post('/reservations')
      .loginAs(customer)
      .json({
        cartons: [
          { size: 'L', quantity: 100 },
          { size: 'M', quantity: 2 },
        ],
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'cartons.*.quantity',
          message: 'The quantity field must not be greater than 15',
          meta: {
            max: 15,
          },
          rule: 'max',
        },
      ],
    })
  })

  test('should not create reservation if not more than 1 cartons reserved', async ({ client }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    const response = await client
      .post('/reservations')
      .loginAs(customer)
      .json({
        cartons: [
          { size: 'L', quantity: 0 },
          { size: 'M', quantity: 2 },
        ],
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'cartons.*.quantity',
          message: 'The quantity field must be at least 1',
          meta: {
            min: 1,
          },
          rule: 'min',
        },
      ],
    })
  })

  test('should rollback transaction on failure', async ({ client, assert }) => {
    const customer = await UserFactory.merge({ type: UserType.CUSTOMER }).create()

    const response = await client
      .post('/reservations')
      .loginAs(customer)
      .json({
        cartons: [
          { size: 'L', quantity: 3 },
          { size: 'M', quantity: 2 },
        ],
      })

    response.assertStatus(404)
    response.assertBodyContains({
      code: 'E_CARTON_NOT_AVAILABLE',
      message: 'Not enough cartons of size L available.',
    })

    const createdReservation = await Reservation.query().where('customerId', customer.id)

    assert.equal(
      createdReservation.length,
      0,
      'No reservations should be created on transaction failure'
    )
  })
})
