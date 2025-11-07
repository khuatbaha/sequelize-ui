import { MAX_IDENTIFIER_LENGTH } from '@src/core/database'
import {
  Association,
  associationsAreSame,
  AssociationTypeType,
  Field,
  Model,
  Schema,
  ThroughType,
} from '@src/core/schema'
import { arrayToLookup } from '@src/utils/array'
import { deepEmpty } from '@src/utils/object'
import {
  nameEmpty,
  nameLongerThan,
  namesEq,
  namesEqSingular,
  nameStartsWithNumber,
} from '@src/utils/string'
import {
  NAME_REQUIRED_MESSAGE,
  NAME_TOO_LONG_MESSAGE,
  NAME_UNIQUE_MESSAGE,
  NAME_WITH_NUMBER_MESSAGE,
  NAME_WITH_SPECIAL_CHAR_MESSAGE,
} from './messages'

// TODO: Unit tests

export type ModelErrors = {
  name?: string
  tableName?: string
  fields: { [id: string]: FieldErrors }
  associations: { [id: string]: AssociationErrors }
}

export type FieldErrors = {
  name?: string
}

export type AssociationErrors = {
  alias?: string
  foreignKey?: string
  targetForeignKey?: string
  throughTable?: string
}

export const emptyModelErrors: ModelErrors = Object.freeze({
  name: undefined,
  tableName: undefined,
  fields: {},
  associations: {},
})

export type SchemaErrors = {
  name?: string
  models: { [id: string]: ModelErrors }
}

export const emptySchemaErrors: SchemaErrors = Object.freeze({
  name: undefined,
  models: {},
})

export function validateSchema(schema: Schema): SchemaErrors {
  return {
    name: validateSchemaName(schema),
    models: validateModels(schema),
  }
}

export function noSchemaErrors(errors: SchemaErrors): boolean {
  return deepEmpty(errors)
}

export function hasSchemaErrors(errors: SchemaErrors): boolean {
  return !noSchemaErrors(errors)
}

function validateSchemaName(schema: Schema): string | undefined {
  if (nameEmpty(schema.name)) {
    return NAME_REQUIRED_MESSAGE
  }

  if (nameStartsWithNumber(schema.name)) {
    return NAME_WITH_NUMBER_MESSAGE
  }

  if (nameLongerThan(schema.name, MAX_IDENTIFIER_LENGTH)) {
    return NAME_TOO_LONG_MESSAGE
  }
}

function validateModels(schema: Schema): { [id: string]: ModelErrors } {
  return schema.models.reduce<{ [id: string]: ModelErrors }>((acc, model) => {
    acc[model.id] = validateModel(model, schema)
    return acc
  }, {})
}

export function validateModel(model: Model, schema: Schema): ModelErrors {
  return {
    name: validateModelName(model, schema),
    fields: validateModelFields(model),
    associations: validateModelAssociations(model, schema),
  }
}

export function noModelErrors(errors: ModelErrors): boolean {
  return deepEmpty(errors)
}

function validateModelName(model: Model, schema: Schema): string | undefined {
  if (nameEmpty(model.name)) {
    return NAME_REQUIRED_MESSAGE
  }

  if (nameLongerThan(model.name, MAX_IDENTIFIER_LENGTH)) {
    return NAME_TOO_LONG_MESSAGE
  }

  if (nameStartsWithNumber(model.name)) {
    return NAME_WITH_NUMBER_MESSAGE
  }

  if (!InputFilters.modelInfo(model.name)) {
    return NAME_WITH_SPECIAL_CHAR_MESSAGE
  }

  if (findDuplicateModel(model, schema)) {
    return NAME_UNIQUE_MESSAGE
  }
}

function validateModelFields(model: Model): { [id: string]: FieldErrors } {
  return model.fields.reduce<{ [id: string]: FieldErrors }>((acc, field) => {
    acc[field.id] = validateField(field, model)
    return acc
  }, {})
}

function validateField(field: Field, model: Model): FieldErrors {
  return {
    name: validateFieldName(field, model),
  }
}

function validateFieldName(field: Field, model: Model): string | undefined {
  if (nameEmpty(field.name)) {
    return NAME_REQUIRED_MESSAGE
  }

  if (nameLongerThan(field.name, MAX_IDENTIFIER_LENGTH)) {
    return NAME_TOO_LONG_MESSAGE
  }

  if (nameStartsWithNumber(field.name)) {
    return NAME_WITH_NUMBER_MESSAGE
  }

  if (!InputFilters.modelInfo(field.name)) {
    return NAME_WITH_SPECIAL_CHAR_MESSAGE
  }

  if (findDuplicateField(field, model)) {
    return NAME_UNIQUE_MESSAGE
  }
}

function validateModelAssociations(
  model: Model,
  schema: Schema,
): { [id: string]: AssociationErrors } {
  return model.associations.reduce<{ [id: string]: AssociationErrors }>((acc, association) => {
    acc[association.id] = validateAssociation(association, model, schema)
    return acc
  }, {})
}

function validateAssociation(
  association: Association,
  model: Model,
  schema: Schema,
): AssociationErrors {
  return {
    alias: validateAssociationAlias(association, model, schema),
    foreignKey: validateAssociationForeignKey(association),
    targetForeignKey: validateAssociationTargetForeignKey(association),
    throughTable: validateAssociationThroughTable(association),
  }
}

function validateAssociationAlias(
  association: Association,
  model: Model,
  schema: Schema,
): string | undefined {
  if (nameLongerThan(association.alias, MAX_IDENTIFIER_LENGTH)) {
    return NAME_TOO_LONG_MESSAGE
  }

  if (nameStartsWithNumber(association.alias)) {
    return NAME_WITH_NUMBER_MESSAGE
  }

  if (association.alias && !InputFilters.modelInfo(association.alias)) {
    return NAME_WITH_SPECIAL_CHAR_MESSAGE
  }

  if (findDuplicateAssociationName(association, model, schema)) {
    return NAME_UNIQUE_MESSAGE
  }
}

function validateAssociationForeignKey(association: Association): string | undefined {
  if (nameLongerThan(association.foreignKey, MAX_IDENTIFIER_LENGTH)) {
    return NAME_TOO_LONG_MESSAGE
  }

  if (nameStartsWithNumber(association.foreignKey)) {
    return NAME_WITH_NUMBER_MESSAGE
  }

  if (association.foreignKey && !InputFilters.modelInfo(association.foreignKey)) {
    return NAME_WITH_SPECIAL_CHAR_MESSAGE
  }
}

function validateAssociationTargetForeignKey(association: Association): string | undefined {
  if (association.type.type === AssociationTypeType.ManyToMany) {
    if (nameLongerThan(association.type.targetFk, MAX_IDENTIFIER_LENGTH)) {
      return NAME_TOO_LONG_MESSAGE
    }

    if (nameStartsWithNumber(association.type.targetFk)) {
      return NAME_WITH_NUMBER_MESSAGE
    }

    if (association.type.targetFk && !InputFilters.modelInfo(association.type.targetFk)) {
      return NAME_WITH_SPECIAL_CHAR_MESSAGE
    }
  }
}

function validateAssociationThroughTable(association: Association): string | undefined {
  if (
    association.type.type === AssociationTypeType.ManyToMany &&
    association.type.through.type === ThroughType.ThroughTable
  ) {
    if (nameLongerThan(association.type.through.table, MAX_IDENTIFIER_LENGTH)) {
      return NAME_TOO_LONG_MESSAGE
    }

    if (nameEmpty(association.type.through.table)) {
      return NAME_REQUIRED_MESSAGE
    }

    if (nameStartsWithNumber(association.type.through.table)) {
      return NAME_WITH_NUMBER_MESSAGE
    }

    if (!InputFilters.modelInfo(association.type.through.table)) {
      return NAME_WITH_SPECIAL_CHAR_MESSAGE
    }
  }
}

function findDuplicateModel(model: Model, schema: Schema): Model | undefined {
  return schema.models.find((m) => m.id !== model.id && namesEqSingular(m.name, model.name))
}

function findDuplicateField(field: Field, model: Model): Field | undefined {
  return model.fields.find((f) => f.id !== field.id && namesEq(f.name, field.name))
}

function findDuplicateAssociationName(
  association: Association,
  model: Model,
  schema: Schema,
): Association | undefined {
  const modelById = arrayToLookup(schema.models, (m) => m.id)
  const targetModel: Model | undefined = modelById.get(association.targetModelId)
  /* istanbul ignore next */
  if (!targetModel) return undefined

  return model.associations.find((a) => {
    if (a.id === association.id) return false
    const aTargetModel: Model | undefined = modelById.get(a.targetModelId)
    /* istanbul ignore next */
    if (!aTargetModel) return false

    return associationsAreSame({
      associationA: association,
      targetNameA: targetModel.name,
      associationB: a,
      targetNameB: aTargetModel.name,
    })
  })
}

export const InputFilters = {
  integer: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/[^-?\d]/g, '')
    return /^-?\d*$/.test(value)
  },

  unsignedInteger: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/\D/g, '')
    return /^\d*$/.test(value)
  },

  limitedInteger:
    (max: number) =>
    (value: string, fix = false): boolean | string => {
      if (fix) {
        const cleaned = value.replace(/\D/g, '')
        const num = parseInt(cleaned || '0', 10)
        return num > max ? String(max) : cleaned
      }
      return /^\d*$/.test(value) && (value === '' || parseInt(value) <= max)
    },

  float: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/[^0-9.,-]/g, '')
    return /^-?\d*[.,]?\d*$/.test(value)
  },

  currency: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/[^0-9.,-]/g, '').replace(/([.,]\d{2})\d+/g, '$1') // chỉ giữ 2 số thập phân
    return /^-?\d*[.,]?\d{0,2}$/.test(value)
  },

  latin: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/[^a-zA-Z]/g, '')
    return /^[a-zA-Z]*$/i.test(value)
  },

  hex: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/[^0-9a-fA-F]/g, '')
    return /^[0-9a-f]*$/i.test(value)
  },

  nonWhitespace: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/[^a-zA-Z0-9_-]/g, '').replace(/^[^a-zA-Z]+/, '')
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/i.test(value)
  },

  modelInfo: (value: string, fix = false): boolean | string => {
    if (fix) return value.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[^a-zA-Z]+/, '')
    return /^[a-zA-Z][a-zA-Z0-9_]*$/i.test(value)
  },
} as const
