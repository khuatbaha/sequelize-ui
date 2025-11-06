import { Model, Schema } from '@src/core/schema'
import {
  backgroundColor,
  classnames,
  display,
  fontSize,
  height,
  margin,
  overflow,
  padding,
  textAlign,
  textDecoration,
  toClassname,
  TTailwindString,
} from '@src/ui/styles/classnames'
import {
  breakWords,
  breakWordsMinus8,
  flexCenterBetween,
  panel,
  panelGrid,
  sectionWide,
  subtitle,
  title,
} from '@src/ui/styles/utils'
import { titleCase } from '@src/utils/string'
import React, { useEffect, useState } from 'react'
import Breadcrumbs from '../Breadcrumbs'
import PanelButton from '../form/PanelButton'
import EyeIcon from '../icons/Eye'
import PencilIcon from '../icons/Pencil'
import PlusCircleIcon from '../icons/Plus'
import TrashIcon from '../icons/Trash'
import ActionMenu from '../menus/ActionMenu'
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  closestCenter,
  DndContext,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type SchemaViewProps = {
  schema: Schema
  onClickModel: (model: Model) => void
  onClickAddModel: () => void
  onClickEditModel: (model: Model) => void
  onClickDeleteModel: (model: Model) => void
}

function SchemaView({
  schema,
  onClickModel,
  onClickAddModel,
  onClickEditModel,
  onClickDeleteModel,
}: SchemaViewProps): React.ReactElement {
  const [models, setModels] = useState(schema.models)
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
      const oldIndex = models.findIndex((i) => i.id === active.id)
      const newIndex = models.findIndex((i) => i.id === over.id)
      schema.models = arrayMove(models, oldIndex, newIndex)
      setModels(schema.models)
      // updateSchema(model)
    }
  }
  useEffect(() => {
    setModels(schema.models)
  }, [schema.models])

  return (
    <div
      className={classnames(
        overflow('overflow-y-scroll'),
        height('h-full'),
        padding('p-2', 'xs:p-4', 'sm:p-6', 'pt-2'),
      )}
    >
      <Breadcrumbs items={[]} current={`${titleCase(schema.name)} (schema)`} />
      <div className={classnames(sectionWide)}>
        <h2 className={classnames(title)}>Schema</h2>
        <div className={classnames(margin('mb-11'))}>
          <p className={classnames(fontSize('text-lg'), breakWords)}>
            Name: {titleCase(schema.name)}
          </p>
        </div>
      </div>
      <div className={classnames(sectionWide)}>
        <h3 className={classnames(subtitle)}>Models</h3>
        <ul className={classnames(panelGrid)}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={models} strategy={rectSortingStrategy}>
              {schema.models.map((model) => (
                <DragableSchemaView
                  key={model.id}
                  model={model}
                  onClickModel={onClickModel}
                  onClickEditModel={onClickEditModel}
                  onClickDeleteModel={onClickDeleteModel}
                  className={classnames(panel, flexCenterBetween, padding('px-2', 'py-3'))}
                />
              ))}
            </SortableContext>
          </DndContext>
          <li>
            <PanelButton
              className={classnames(
                backgroundColor(
                  backgroundColor('hover:bg-green-50', toClassname('dark:hover:bg-green-900')),
                ),
              )}
              label="Create a new model"
              icon={PlusCircleIcon}
              iconProps={{ size: 6 }}
              onClick={onClickAddModel}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}

type DragableSchemaViewProps = {
  model: Model
  onClickModel: (model: Model) => void
  onClickEditModel: (model: Model) => void
  onClickDeleteModel: (model: Model) => void
  className: string | TTailwindString
}
function DragableSchemaView({
  model,
  onClickModel,
  onClickEditModel,
  onClickDeleteModel,
  className,
}: DragableSchemaViewProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef } =
    useSortable({ id: model.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <li
      id={model.id}
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={className as TTailwindString}
    >
      <h3
        ref={setActivatorNodeRef}
        {...listeners}
        tabIndex={-1}
        className={classnames(
          breakWordsMinus8,
          textAlign('text-left'),
          textDecoration('hover:underline'),
          padding('px-1.5'),
          fontSize('text-lg'),
        )}
        // onClick={onClickModel.bind(null, model)}
      >
        ⋮⋮ {titleCase(model.name)}
      </h3>
      <div className={classnames(display('flex'))}>
        <ActionMenu
          items={[
            {
              icon: EyeIcon,
              label: 'View',
              onClick: onClickModel.bind(null, model),
            },
            {
              icon: PencilIcon,
              label: 'Edit',
              onClick: onClickEditModel.bind(null, model),
            },
            {
              icon: TrashIcon,
              label: 'Delete',
              onClick: onClickDeleteModel.bind(null, model),
            },
          ]}
        />
      </div>
    </li>
  )
}

export default React.memo(SchemaView)
