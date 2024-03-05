import User, { UserType } from '#auth/models/user'
import Carton, { CartonStatus } from '#cartons/models/carton'
import Reservation, { ReservationStatus } from '#reservations/models/reservation'
import { reservationValidator } from '#reservations/validators/reservation_validator'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ReservationController {
  async view({ params, response }: HttpContext) {
    const reservation = await Reservation.findOrFail(params.id)
    return response.ok(reservation)
  }

  async add({ auth, response, request }: HttpContext) {
    const user = auth.user!

    if (user.type !== UserType.CUSTOMER) {
      return response.forbidden({
        message: 'Access Denied. You do not have permission to access this resource.',
        code: 'E_FORBIDDEN',
      })
    }

    const reservedCartons = await request.validateUsing(reservationValidator)

    await db
      .transaction(async (trx) => {
        const createdReservation = await Reservation.create(
          {
            customerId: user.id,
            status: ReservationStatus.RESERVED,
          },
          { client: trx }
        )

        for (const { size, quantity } of reservedCartons.cartons) {
          const availableCartons = await Carton.query({ client: trx })
            .where('size', size)
            .andWhere('status', CartonStatus.INSTOCK)
            .limit(quantity)
            .forUpdate() // Verrouille les lignes pour éviter les conflits de concurrence

          if (availableCartons.length < quantity) {
            trx.rollback()
            return response.notFound({
              message: `Not enough cartons of size ${size} available.`,
              code: 'E_CARTON_NOT_AVAILABLE',
            })
          }

          await Promise.all(
            availableCartons.map(async (carton) => {
              carton.useTransaction(trx)
              carton.status = CartonStatus.RESERVED
              carton.reservationId = createdReservation.id
              await carton.save()
            })
          )
        }

        return response.created()
      })
      .catch(() => {
        return response.internalServerError({
          message: 'An error occurred while processing your request.',
        })
      })
  }

  async edit({}: HttpContext) {
    //modifier une reservation (retirer des carton ou en ajouter ???)
  }

  async canceled({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const reservation = await Reservation.findOrFail(params.id)

    if (user.id !== reservation.customerId) {
      return response.forbidden({
        message: 'Access Denied. You do not have permission to access this resource.',
        code: 'E_FORBIDDEN',
      })
    }

    await db
      .transaction(async (trx) => {
        reservation.useTransaction(trx)

        reservation.status = ReservationStatus.CANCELED
        await reservation.save()

        const cartons = await Carton.query({ client: trx }).where('reservationId', reservation.id)

        await Promise.all(
          cartons.map(async (carton) => {
            carton.useTransaction(trx)
            carton.status = CartonStatus.INSTOCK
            carton.reservationId = null
            return await carton.save()
          })
        )

        return response.status(200)
      })
      .catch(() => {
        return response.internalServerError({
          message: 'An error occurred while processing your request.',
        })
      })
  }

  async listReservation({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

    if (user.type !== UserType.CUSTOMER) {
      return response.forbidden({
        message: 'The specified user is not a customer.',
        code: 'E_FORBIDDEN',
      })
    }

    const reservations = await Reservation.query().where('customerId', user.id)

    return response.ok(reservations)
  }
}
