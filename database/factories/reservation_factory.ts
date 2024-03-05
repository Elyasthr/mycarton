import Reservation, { ReservationStatus } from '#reservations/models/reservation'
import factory from '@adonisjs/lucid/factories'

export const ReservationFactory = factory
  .define(Reservation, async () => {
    return {
      status: ReservationStatus.RESERVED,
    }
  })
  .build()
