import { displayDataType, displayDefaultValue, Field } from '@src/core/schema'
import {
  classnames,
  display,
  fontWeight,
  inset,
  justifyContent,
  margin,
  overflow,
  padding,
  position,
  textOverflow,
  toClassname,
  TTailwindString,
} from '@src/ui/styles/classnames'
import { breakWordsMinus8, panelHeader } from '@src/ui/styles/utils'
import React from 'react'
import PencilIcon from '../icons/Pencil'
import TrashIcon from '../icons/Trash'
import ActionMenu from '../menus/ActionMenu'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type FieldViewProps = {
  field: Field
  onClickEdit: () => void
  onClickDelete: () => void
  className: string | TTailwindString
}
function FieldView({ field, onClickEdit, onClickDelete, className }: FieldViewProps) {
  const defaultValue = displayDefaultValue(field.type)
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef } =
    useSortable({ id: field.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      id={field.id}
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={classnames(className as TTailwindString)}
    >
      <div
        className={classnames(
          panelHeader,
          display('flex'),
          justifyContent('justify-between'),
          position('relative'),
        )}
      >
        <p
          ref={setActivatorNodeRef}
          {...listeners}
          className={classnames(padding('px-1'), fontWeight('font-bold'), breakWordsMinus8)}
        >
          {/* {noCase(field.name)} */}
          ⋮⋮ {field.name}
        </p>
        <ActionMenu
          className={classnames(position('absolute'), inset('right-0', 'top-1', 'right-1'))}
          items={[
            { icon: PencilIcon, label: 'Edit', onClick: onClickEdit },
            { icon: TrashIcon, label: 'Delete', onClick: onClickDelete },
          ]}
        />
      </div>
      <div
        className={classnames(
          padding('p-2'),
          overflow('overflow-hidden'),
          textOverflow('text-ellipsis'),
        )}
        onClick={onClickEdit}
      >
        <p>{displayDataType(field.type)}</p>
        {field.primaryKey && <p>Primary key</p>}
        {field.required && <p>Required</p>}
        {field.unique && <p>Unique</p>}
        {defaultValue && (
          <p className={classnames(overflow('overflow-hidden'), textOverflow('text-ellipsis'))}>
            <span className={classnames(display('flex'))}>
              Default:{' '}
              <span className={classnames(margin('ml-1'), toClassname('pt-[0.5px]'))}>
                {defaultValue}
              </span>
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export default React.memo(FieldView)
