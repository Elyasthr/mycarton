import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.timestamp('created_at', { useTz: false }).notNullable()
      table.timestamp('updated_at', { useTz: false }).notNullable()
      table.string('name').notNullable()
      table.string('address').notNullable()
      table.string('city').notNullable()
      table.string('zip_code').notNullable()
      table.enu('type', ['CUSTOMER', 'MERCHANT']).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
