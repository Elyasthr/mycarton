import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reservations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.timestamp('created_at', { useTz: false }).notNullable()
      table.timestamp('updated_at', { useTz: false }).notNullable()
      table.enum('status', ['RESERVED', 'MODIFIED', 'COMPLETED', 'CANCELED']).notNullable()
      table.integer('customer_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
