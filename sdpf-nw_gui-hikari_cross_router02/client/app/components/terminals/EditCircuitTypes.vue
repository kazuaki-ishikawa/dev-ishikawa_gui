<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes, TerminalDeviceTypes } from '@/api/constants'
import type { TerminalDeviceType } from '@/api/types'
import { TERMINAL_LINK } from '@/api/terminals/constants'
import type { PrimaryCircuitType, SecondaryCircuitType } from '@/api/terminals/types'

export type InputCircuitType = {
  primary: PrimaryCircuitType
  secondary?: SecondaryCircuitType
}

type PropType = {
  primaryCircuitType: string
  secondaryCircuitType: string
  disabled?: boolean
  original?: InputCircuitType
  terminalDeviceType?: TerminalDeviceType
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  original: undefined,
  terminalDeviceType: undefined,
})

type Emits = {
  (e: 'checked', circuitTypes: InputCircuitType): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const isRouter02 = computed(() => props.terminalDeviceType === TerminalDeviceTypes.Router02)

const optionItemsWithSim = computed(() => {
  const list: InputCircuitType[] = [
    { primary: CircuitTypes.Mobile },
    { primary: CircuitTypes.Ipoe, secondary: CircuitTypes.Mobile },
    { primary: CircuitTypes.Guarantee, secondary: CircuitTypes.Mobile },
  ]
  return list
})
const optionItemsWithoutSim = computed(() => {
  if (isRouter02.value) {
    return [{ primary: CircuitTypes.Ipoe }]
  }
  if (props.original) {
    if (props.original.primary === CircuitTypes.Guarantee) {
      const secondary = props.original.secondary === CircuitTypes.Ipoe ? CircuitTypes.Ipoe : undefined
      return [{ primary: CircuitTypes.Guarantee, secondary }]
    } else {
      return [{ primary: CircuitTypes.Ipoe }]
    }
  }
  return [
    { primary: CircuitTypes.Guarantee, secondary: CircuitTypes.Ipoe },
    { primary: CircuitTypes.Guarantee },
    { primary: CircuitTypes.Ipoe },
  ]
})
// style 指定用の行数
const withSimRowCounts = computed(() => optionItemsWithSim.value.length + 1)
const withoutSimRowCounts = computed(() => optionItemsWithoutSim.value.length + 1)

const isItemSelected = (item: InputCircuitType) => {
  return item.primary === props.primaryCircuitType && (item.secondary || '') === props.secondaryCircuitType
}
const items = computed(() => {
  if (isRouter02.value) {
    return [{ sims: false, options: optionItemsWithoutSim.value }]
  }
  if (props.original) {
    if (
      props.original.secondary === CircuitTypes.Ipoe ||
      (props.original.primary === CircuitTypes.Ipoe && !props.original.secondary) ||
      (props.original.primary === CircuitTypes.Guarantee && !props.original.secondary)
    ) {
      return [{ sims: false, options: optionItemsWithoutSim.value }]
    } else {
      return [{ sims: true, options: optionItemsWithSim.value }]
    }
  } else {
    return [
      { sims: true, options: optionItemsWithSim.value },
      { sims: false, options: optionItemsWithoutSim.value },
    ]
  }
})

const handleClick = (item: InputCircuitType) => {
  const changed = item.primary !== props.primaryCircuitType || (item.secondary ?? '') !== props.secondaryCircuitType
  if (!props.disabled && changed) {
    emits('checked', item)
  }
}
</script>

<template>
  <InnerCard :title="t('terminals.selectCircuitType')">
    <template #help>
      <i18n-t keypath="terminals.help.selectCircuitType" scope="global">
        <template #linkText>
          <NuxtLink :to="TERMINAL_LINK.CIRCUIT_TYPE" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </template>
    <div class="my-2">{{ t('terminals.message.selectCircuitType') }}</div>
    <i18n-t
      v-if="!original"
      class="text-warning mb-2"
      keypath="terminals.note.selectCircuitType"
      tag="div"
      scope="global"
    >
      <template #linkText>
        <NuxtLink :to="TERMINAL_LINK.CHANGE_ROUTER" target="_blank">
          {{ t('common.here') }}
        </NuxtLink>
      </template>
    </i18n-t>
    <div class="edit-circuit-types-table">
      <div class="header">
        <div class="cell" />
        <div class="cell">
          <div class="w-100 text-center">{{ t('terminals.primaryCircuit') }}</div>
        </div>
        <div class="cell">
          <div class="w-100 text-center">{{ t('terminals.secondaryCircuit') }}</div>
        </div>
        <div class="cell">
          <div class="w-100 text-center">{{ t('terminals.router') }}</div>
        </div>
      </div>
      <div class="body">
        <div v-for="item in items" :key="`row-group-${item.sims}`" class="row-group" :class="{ sims: item.sims }">
          <div
            v-for="row in item.options"
            :key="`row-${row.primary}-${row.secondary || 'nothing'}`"
            class="row"
            :class="{ sims: item.sims }"
          >
            <div class="cell">
              <div class="radio" :class="{ checked: isItemSelected(row), disabled }">
                <div class="button" :data-cy="`${row.primary}-${row.secondary}`" @click="handleClick(row)" />
              </div>
            </div>
            <div class="cell flex-center-center">
              <div class="w-100 text-center">{{ t(`service.${row.primary}`) }}</div>
            </div>
            <div class="cell flex-center-center">
              <div class="w-100 text-center">{{ row.secondary ? t(`service.${row.secondary}`) : '' }}</div>
            </div>
          </div>
          <div class="row-last" :class="{ sims: item.sims }">
            <div class="cell flex-center-center">
              {{ item.sims ? t('terminals.withSim') : t('terminals.withoutSim') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </InnerCard>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));
$light-primary-color: rgb(var(--v-theme-light-primary));
$light-info-color: rgb(var(--v-theme-light-info));
$sim-row-counts: v-bind(withSimRowCounts);
$without-sim-row-counts: v-bind(withoutSimRowCounts);
$grid-gap: 0.25rem;

.radio {
  position: relative;
  cursor: pointer;
  &.checked:not(.disabled) .button {
    border: 1px solid $secondary-color;
    &::after {
      width: 12px;
      height: 12px;
    }
  }

  &.disabled {
    cursor: auto;
    color: $info-color;
    &.checked .button::after {
      width: 12px;
      height: 12px;
      background-color: $info-color;
    }
    .button {
      border: 1px solid $light-info-color;
      background-color: v.$light-info-alpha-color;
    }
  }

  .button {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid $info-color;
    position: absolute;
    top: 0;
    left: 0;
    background-color: #fff;
    &::after {
      content: '';
      display: block;
      background-color: $secondary-color;
      border-radius: 50%;
      position: absolute;
      top: $grid-gap;
      left: $grid-gap;
    }
  }
}

.common-grid {
  display: grid;
  grid-gap: $grid-gap;
}

.edit-circuit-types-table {
  width: max-content;
  border-radius: v.$child-border-radius;
  overflow: hidden;
  height: fit-content;

  .header {
    @extend .common-grid;
    grid-template-columns: 3rem 16rem 16rem 10rem;
    font-size: 0.8rem;
    .cell {
      background-color: $light-primary-color;
      color: $secondary-color;
      font-size: 0.85rem;
      padding: $grid-gap 0;
    }
  }
  .body {
    min-width: fit-content;
    .row-group {
      @extend .common-grid;
      grid-template-columns: 3rem 16rem 16rem 10rem;
      &:not(:first-child) {
        padding-top: $grid-gap;
      }
    }
    .row {
      @extend .common-grid;
      grid-template-columns: 3rem 16rem 16rem;
      grid-column: 1;
    }
    .row-last {
      @extend .common-grid;
      grid-column: 4 / 5;
      &.sims {
        grid-row: 1 / $sim-row-counts;
      }
      &:not(.sims) {
        grid-row: 1 / $without-sim-row-counts;
      }
    }
    .cell {
      padding: 0.75rem;
      background-color: #fff;
    }
  }
}
</style>
