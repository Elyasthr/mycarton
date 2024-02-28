import factory from '@adonisjs/lucid/factories'
import User from '#auth/models/user'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      name: faker.internet.userName(),
      adress: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      type: 'client',
      email: faker.internet.email(),
      password: 'totototo',
    }
  })
  .build()
