import factory from '@adonisjs/lucid/factories'
import User, { UserType } from '#auth/models/user'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      name: faker.internet.userName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      type: UserType.CUSTOMER,
      email: faker.internet.email(),
      password: 'totototo',
    }
  })
  .build()
