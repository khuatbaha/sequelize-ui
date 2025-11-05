import schemaApi from '@src/api/schema'
import userPreferences from '@src/api/userPreferences'
import { Schema } from '@src/core/schema'
import IconButton from '@src/ui/components/form/IconButton'
import InfoIcon from '@src/ui/components/icons/Info'
import Modal from '@src/ui/components/Modal'
import useAsync from '@src/ui/hooks/useAsync'
import useIsOpen from '@src/ui/hooks/useIsOpen'
import { useAlert } from '@src/ui/lib/alert'
import RouteLink from '@src/ui/routing/RouteLink'
import { newSchemaRoute } from '@src/ui/routing/routes'
import {
  backgroundColor,
  classnames,
  display,
  fontSize,
  lineHeight,
  margin,
  minHeight,
  toClassname,
  verticalAlign,
  width,
} from '@src/ui/styles/classnames'
import { flexCenter, flexCenterVertical, fontColor, inlineButton } from '@src/ui/styles/utils'
import { clear } from '@src/utils/localStorage'
import dynamic from 'next/dynamic'
import React from 'react'
import { MY_SCHEMAS_ID } from './constants'
import MySchemaLinks from './MySchemaLinks'
import SchemasError from './SchemasError'
import SaveIcon from '../../components/icons/Save'
import FolderIcon from '../../components/icons/Folder'

const SchemaStorageInfo = dynamic(() => import('./SchemaStorageInfo'))

const CLEAR_DATA_SUCCESS_COPY = 'All schemas deleted.'
const CLEAR_DATA_ERROR_COPY = `Failed to delete schemas. Try clearing localStorage or site data through your browser's developer console.`

export default function MySchemas(): React.ReactElement {
  const { data: schemas, error, refetch } = useAsync({ getData: schemaApi.listSchemas })

  const { isOpen: isInfoModalOpen, open: openInfoModal, close: closeInfoModal } = useIsOpen()

  const { success, error: logError } = useAlert()

  const handleClickClearData = async () => {
    await clear()
    refetch()
  }

  const handleConfirmMySchemaInfo = async () => {
    try {
      await Promise.all([schemaApi.deleteAllSchemas(), userPreferences.clearPreferences()])
      await refetch()
      success(CLEAR_DATA_SUCCESS_COPY)
      closeInfoModal()
    } catch (e) {
      console.error(e)
      logError(CLEAR_DATA_ERROR_COPY, { ttl: 10000 })
    }
  }

  const handleClickExportSchema = async () => {
    const schemas = await schemaApi.listSchemas()
    downloadJSON(schemas, 'schemas.json')
  }

  const handleClickImportSchema = async () => {
    uploadJSON(async (data: Schema | Schema[]) => {
      if (data) {
        if (Array.isArray(data)) {
          data.forEach(async (schema) => {
            try {
              const found = schemas?.find((s) => s.name === schema.name)
              if (found) {
                schema.id = found.id // maintain ID for update
                await schemaApi.updateSchema(schema)
                console.log(`Update Schema "${schema.name}" "${schema.id}" successfully.`)
              } else {
                await schemaApi.createSchema(schema)
                console.log(`Create Schema "${schema.name}" "${schema.id}"  successfully.`)
              }
            } catch (e) {
              console.error(`Failed to import schema "${schema.name}" "${schema.id}".`, e)
            }
          })
          success(`Schema imported successfully.`)
          await refetch()
        } else {
          try {
            const schema: Schema = data
            const found = schemas?.find((s) => s.name === schema.name)
            if (found) {
              schema.id = found.id // maintain ID for update
              await schemaApi.updateSchema(schema)
              console.log(`Update Schema "${schema.name}" "${schema.id}" successfully.`)
            } else {
              await schemaApi.createSchema(schema)
              console.log(`Create Schema "${schema.name}" "${schema.id}"  successfully.`)
            }
            await refetch()
            success(`Schema "${schema.name}" "${schema.id}" imported successfully.`)
          } catch (e) {
            console.error(`Failed to import schema`, e)
          }
        }
      } else {
        console.log('Không tìm thấy "schema" trong file JSON!')
      }
    })
  }

  type SchemasStateProps = { schemas: Schema[]; onClickInfo: () => void }

  function SchemasState({ schemas, onClickInfo }: SchemasStateProps): React.ReactElement {
    return (
      <>
        <div className={classnames(flexCenterVertical, margin('mb-4'))}>
          <h2 className={classnames(fontColor, fontSize('text-2xl'))}>My Schemas</h2>
          <IconButton
            className={classnames(margin('ml-1'))}
            icon={InfoIcon}
            iconProps={{ size: 5, strokeWidth: 2 }}
            label="my schemas info"
            onClick={onClickInfo}
          />
          <IconButton
            className={classnames(margin('ml-1'), display('hidden', 'xs:inline-block'))}
            label="import schema"
            icon={SaveIcon}
            iconProps={{
              size: 6,
            }}
            onClick={handleClickImportSchema}
          />
          <IconButton
            className={classnames(margin('ml-1'), display('hidden', 'xs:inline-block'))}
            label="export schema"
            icon={FolderIcon}
            iconProps={{
              size: 6,
            }}
            onClick={handleClickExportSchema}
          />
        </div>
        <div className={classnames(flexCenter)}>
          <MySchemaLinks schemas={schemas} />
        </div>
      </>
    )
  }

  return (
    <>
      <div
        className={classnames(minHeight('min-h-26', 'xs:min-h-20', 'md:min-h-10'), width('w-full'))}
      >
        {!schemas && error && <SchemasError onClickClearData={handleClickClearData} />}
        {false && schemas && schemas!.length === 0 && <ZeroState onClickOpenInfo={openInfoModal} />}
        {false && schemas && schemas!.length > 0 && (
          <SchemasState schemas={schemas!} onClickInfo={openInfoModal} />
        )}
        {schemas && <SchemasState schemas={schemas} onClickInfo={openInfoModal} />}
      </div>
      <Modal
        id="my-schemas-info"
        title="Schema Storage"
        isOpen={isInfoModalOpen}
        onClose={closeInfoModal}
        confirmText="Clear my data"
        confirmDestructive
        onConfirm={handleConfirmMySchemaInfo}
      >
        {isInfoModalOpen && <SchemaStorageInfo />}
      </Modal>
    </>
  )
}

type ZeroStateProps = { onClickOpenInfo: () => void }

function ZeroState({ onClickOpenInfo }: ZeroStateProps): React.ReactElement {
  return (
    <>
      <div id={MY_SCHEMAS_ID} className={classnames(flexCenter)}>
        <p className={classnames(fontSize('text-base'), lineHeight('leading-loose'))}>
          To get started,{' '}
          <RouteLink
            route={newSchemaRoute()}
            prefetch={false}
            className={classnames(
              inlineButton(),
              margin('mx-1'),
              backgroundColor(
                'bg-indigo-100',
                'hover:bg-indigo-200',
                'dark:bg-indigo-700',
                toClassname('dark:hover:bg-indigo-900'),
              ),
            )}
          >
            create a new schema
          </RouteLink>{' '}
          or select one of the example schemas{' '}
          <span className={classnames(display('inline-block'))}>
            below.
            <span className={classnames(verticalAlign('align-middle'))}>
              <IconButton
                className={classnames(margin('ml-1'))}
                icon={InfoIcon}
                iconProps={{ size: 5, strokeWidth: 2 }}
                label="my schemas info"
                onClick={onClickOpenInfo}
              />
            </span>
          </span>
        </p>
      </div>
    </>
  )
}

// ====== Web browser download/upload helper ======
export function downloadJSON(schema: Schema | Schema[], filename = 'schema.json'): void {
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function uploadJSON(onLoad: (data: any) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.style.display = 'none'
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files?.length) return
    const file = target.files[0]
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      onLoad(data)
    } catch (err) {
      console.error('Invalid JSON file:', err)
    }
    document.body.removeChild(input)
  }
  document.body.appendChild(input)
  input.click()
}
