import { DateTime } from 'luxon'
import { withAuthFinder } from '@adonisjs/auth'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { Opaque } from '@adonisjs/core/types/helpers'
import { type HasMany } from '@adonisjs/lucid/types/relations'
import Reservation from '#reservations/models/reservation'
import Carton from '#cartons/models/carton'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
}

export type UserId = Opaque<'UserId', number>

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: UserId

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare name: string

  @column()
  declare address: string

  @column()
  declare city: string

  @column()
  declare zipCode: string

  @column()
  declare type: UserType

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @hasMany(() => Carton, {
    foreignKey: 'merchantId',
  })
  declare cartons: HasMany<typeof Carton>

  @hasMany(() => Reservation, {
    foreignKey: 'customerId',
  })
  declare reservations: HasMany<typeof Reservation>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
