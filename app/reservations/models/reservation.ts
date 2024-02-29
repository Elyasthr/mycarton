import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Carton from '#cartons/models/carton'
import User, { type UserId } from '#auth/models/user'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { Opaque } from '@adonisjs/core/types/helpers'

export type ReservationId = Opaque<'ReservationId', number>

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  MODIFIED = 'MODIFIED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export default class Reservation extends BaseModel {
  @column({ isPrimary: true })
  declare id: ReservationId

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare status: ReservationStatus

  @column()
  declare customerId: UserId

  @belongsTo(() => User, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof User>

  @hasMany(() => Carton, { foreignKey: 'reservationId' })
  declare cartons: HasMany<typeof Carton>
}
