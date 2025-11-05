import { displayDataType, displayDefaultValue, Field } from '@src/core/schema'
import {
  classnames,
  display,
  fontWeight,
  inset,
  justifyContent,
  margin,
  padding,
  position,
  toClassname,
  TTailwindString,
} from '@src/ui/styles/classnames'
import { breakWordsMinus8, list, panelHeader } from '@src/ui/styles/utils'
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
          {field.name}
        </p>
        <ActionMenu
          className={classnames(position('absolute'), inset('right-0', 'top-1', 'right-1'))}
          items={[
            { icon: PencilIcon, label: 'Edit', onClick: onClickEdit },
            { icon: TrashIcon, label: 'Delete', onClick: onClickDelete },
          ]}
        />
      </div>
      <ul className={classnames(list, padding('p-2', 'pl-4'))}>
        <li>{displayDataType(field.type)}</li>
        {field.primaryKey && <li>Primary key</li>}
        {field.required && <li>Required</li>}
        {field.unique && <li>Unique</li>}
        {defaultValue && (
          <li>
            <span className={classnames(display('flex'))}>
              Default:{' '}
              <pre className={classnames(margin('ml-1'), toClassname('pt-[0.5px]'))}>
                {defaultValue}
              </pre>
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}

export default React.memo(FieldView)
