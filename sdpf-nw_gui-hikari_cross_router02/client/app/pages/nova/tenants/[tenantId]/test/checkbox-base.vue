<script setup lang="ts">
type CheckState = 'none' | 'checked' | 'indeterminate'
type Status = 'enable' | 'disabled'
type Column = {
  title: string
  error: boolean
}
type Row = {
  state: CheckState
  status: Status
  values: boolean[]
}

const columns: Column[] = [
  { title: 'isInvalid=false', error: false },
  { title: 'isInvalid=true', error: true },
]

const rows: Row[] = [
  { state: 'none', status: 'enable', values: [false, false] },
  { state: 'none', status: 'disabled', values: [false, false] },
  { state: 'checked', status: 'enable', values: [true, true] },
  { state: 'checked', status: 'disabled', values: [true, true] },
  { state: 'indeterminate', status: 'enable', values: [false, false] },
  { state: 'indeterminate', status: 'disabled', values: [false, false] },
]

const stateLabels: Record<CheckState, string> = {
  none: 'none',
  checked: 'checked',
  indeterminate: 'Indeterminate',
}

const isFirstStateRow = (rowIndex: number) => rowIndex % 2 === 0
const isDisabled = (status: Status) => status === 'disabled'
const isIndeterminate = (state: CheckState) => state === 'indeterminate'
</script>

<template>
  <div class="table">
    <div class="header-spacer" />
    <div v-for="column in columns" :key="column.title" class="header">
      {{ column.title }}
    </div>

    <template v-for="(row, rowIndex) in rows" :key="`${row.state}-${row.status}`">
      <div class="row-labels">
        <div v-if="isFirstStateRow(rowIndex)">
          {{ stateLabels[row.state] }}
        </div>
        <div class="status-label">
          {{ row.status }}
        </div>
      </div>

      <div v-for="(column, columnIndex) in columns" :key="column.title" class="cell">
        <NovaCheckboxBase
          v-model="row.values[columnIndex]!"
          :error="column.error"
          :disabled="isDisabled(row.status)"
          :indeterminate="isIndeterminate(row.state)"
        />
      </div>
    </template>

    <template v-for="(row, rowIndex) in rows" :key="`${row.state}-${row.status}`">
      <div class="row-labels">
        <div v-if="isFirstStateRow(rowIndex)">{{ stateLabels[row.state] }}(ラベルつき)</div>
        <div class="status-label">
          {{ row.status }}
        </div>
      </div>

      <div v-for="(column, columnIndex) in columns" :key="column.title" class="cell">
        <NovaCheckboxBase
          v-model="row.values[columnIndex]!"
          :label="`Label for ${stateLabels[row.state]} and ${row.status}`"
          :error="column.error"
          :disabled="isDisabled(row.status)"
          :indeterminate="isIndeterminate(row.state)"
        />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.table {
  display: grid;
  grid-template-columns: 300px repeat(2, 200px);
  row-gap: 20px;
  align-items: center;
}

.header {
  text-align: center;
}

.row-labels {
  position: relative;
  display: grid;
  grid-template-columns: 220px 80px;
  align-items: center;
}

.status-label {
  grid-column: 2;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 32px;
}
</style>
