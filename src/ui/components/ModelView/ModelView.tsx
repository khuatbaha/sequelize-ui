import { Association, Field, Model, Schema } from '@src/core/schema'
import {
  backgroundColor,
  classnames,
  display,
  fontSize,
  height,
  margin,
  minHeight,
  overflow,
  padding,
  toClassname,
} from '@src/ui/styles/classnames'
import { breakWords, panel, panelGrid, sectionWide, title } from '@src/ui/styles/utils'
import { titleCase } from '@src/utils/string'
import React, { useState } from 'react'
import Breadcrumbs from '../Breadcrumbs'
import PanelButton from '../form/PanelButton'
import PlusCircleIcon from '../icons/Plus'
import AssociationView from './AssociationView'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import FieldView from './FieldView'

type ModelViewProps = {
  schema: Schema
  model: Model
  onChange: (model: Model) => void
  onViewSchema: (model?: Model) => void
  onClickAddField: () => void
  onClickEditField: (field: Field) => void
  onClickDeleteField: (field: Field) => void
  onClickAddAssociation: () => void
  onClickEditAssociation: (association: Association) => void
  onClickDeleteAssociation: (association: Association) => void
}

export default function ModelView({
  schema,
  model,
  onChange,
  onViewSchema,
  onClickAddField,
  onClickEditField,
  onClickDeleteField,
  onClickAddAssociation,
  onClickEditAssociation,
  onClickDeleteAssociation,
}: ModelViewProps): React.ReactElement {
  const [fields, setFields] = useState(model.fields)
  // const handleChangeModel = React.useCallback(
  //   (changes: Partial<Model>) => {
  //     onChange({ ...model, ...changes })
  //     console.log(
  //       'handleChangeModel',
  //       changes.fields?.map((f) => f.name),
  //     )
  //   },
  //   [model, onChange],
  // )
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((i) => i.id === active.id)
      const newIndex = fields.findIndex((i) => i.id === over.id)
      const _fields = arrayMove(fields, oldIndex, newIndex)
      setFields(_fields)
      // model.fields = _fields
      onChange({ ...model, fields: _fields })
      // console.log(
      //   'DragEnd',
      //   _fields.map((f) => f.name),
      //   model.fields.map((f) => f.name),
      // )
    }
  }

  // useEffect(() => {
  //   console.log(model.fields.map((f) => f.name))
  // }, [model.fields])

  return (
    <div
      className={classnames(
        overflow('overflow-y-scroll'),
        height('h-full'),
        padding('pt-2', 'p-2', 'xs:p-4', 'sm:p-6'),
        margin('mb-3'),
      )}
    >
      <Breadcrumbs
        items={[{ label: `${titleCase(schema.name)} (schema)`, onClick: () => onViewSchema() }]}
        current={`${model && titleCase(model.name)} (model)`}
      />
      <div className={classnames(sectionWide)}>
        <h2 className={classnames(title)}>
          <pre>{titleCase(model.name)}</pre>
        </h2>
        <ul className={classnames(margin('mb-11'))}>
          <li className={classnames(fontSize('text-base'), breakWords, display('flex'))}>
            <span className={classnames(margin('mr-2'))}>tableName:</span>
            <pre>{model?.tableName ? model.tableName : model.name}</pre>
          </li>
          <li className={classnames(fontSize('text-base'), breakWords, display('flex'))}>
            <span className={classnames(margin('mr-2'))}>Soft Delete:</span>
            <pre>{model.softDelete.toString()}</pre>
          </li>
          <li className={classnames(fontSize('text-base'), breakWords, display('flex'))}>
            <span className={classnames(margin('mr-2'))}>timestamps:</span>
            <pre>{model.timestamps.toString()}</pre>
          </li>
        </ul>
      </div>
      <div className={classnames(sectionWide)}>
        <h3 className={classnames(title)}>Fields</h3>

        <div className={classnames(panelGrid)}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fields} strategy={rectSortingStrategy}>
              {fields.map((field) => {
                return (
                  <FieldView
                    key={field.id}
                    field={field}
                    className={panel}
                    onClickEdit={onClickEditField.bind(null, field)}
                    onClickDelete={onClickDeleteField.bind(null, field)}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
          <div>
            <PanelButton
              label="Add Field"
              className={classnames(
                backgroundColor('hover:bg-green-50', toClassname('dark:hover:bg-green-900')),
              )}
              icon={PlusCircleIcon}
              iconProps={{ size: 6 }}
              onClick={onClickAddField}
            />
          </div>
        </div>
      </div>
      <div className={classnames(sectionWide)}>
        <h3 className={classnames(title, margin('mt-6'))}>Associations</h3>

        <ul className={panelGrid}>
          {model.associations.map((association) => (
            <li key={association.id} className={classnames(panel, minHeight('min-h-22'))}>
              <AssociationView
                association={association}
                schema={schema}
                onClickModel={onViewSchema}
                onClickEdit={onClickEditAssociation.bind(null, association)}
                onClickDelete={onClickDeleteAssociation.bind(null, association)}
              />
            </li>
          ))}
          <li>
            <PanelButton
              label="Add association"
              className={classnames(
                backgroundColor('hover:bg-green-50', toClassname('dark:hover:bg-green-900')),
              )}
              icon={PlusCircleIcon}
              iconProps={{ size: 6 }}
              onClick={onClickAddAssociation}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
