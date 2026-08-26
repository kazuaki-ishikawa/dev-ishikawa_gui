<script setup lang="ts">
import type {
  DatePickerModelValueType,
  RangeDatePickerModelValueType,
  MonthPickerModelValueType,
  RangeMonthPickerModelValueType,
  YearPickerModelValueType,
  RangeYearPickerModelValueType,
  YearMonthValue,
} from '@/components/nova/form/calendar/types'

const today = new Date().toISOString().slice(0, 10)

const inputDate = ref<DatePickerModelValueType>('2020/6')
const inputDates = ref<RangeDatePickerModelValueType>([today, today])

const inputYearMonth = ref<MonthPickerModelValueType>(null)
const inputYearMonths = ref<RangeMonthPickerModelValueType>([])

const inputYear = ref<YearPickerModelValueType>(null)
const inputYears = ref<RangeYearPickerModelValueType>([])

const reproStartDate = '2035-12-01'
const reproDateFromStartDate = ref<DatePickerModelValueType>('')
const reproMonthFromStartDate = ref<MonthPickerModelValueType>(null)

const disabledDates = (date: Date) => {
  return new Date().getDate() - 1 === date.getDate() - 1
}

const formValid = ref<boolean>(false)
const disabled = computed(() => !formValid.value)

const reproDateRange = ref<RangeDatePickerModelValueType>(['2024-06-10', '2024-06-20'])
const reproMonthRange = ref<RangeMonthPickerModelValueType>([
  { year: 2024, month: 5 },
  { year: 2024, month: 6 },
])
const reproYearRange = ref<RangeYearPickerModelValueType>([2016, 2018])

const reproFormValid = ref(false)

const validationText = computed(() => {
  if (reproFormValid.value === null) {
    return '未検証'
  }
  return reproFormValid.value ? 'valid' : 'invalid'
})

const setDateRange = async (value: RangeDatePickerModelValueType) => {
  reproDateRange.value = value
}

const setMonthRange = async (value: RangeMonthPickerModelValueType) => {
  reproMonthRange.value = value
}

const setYearRange = async (value: RangeYearPickerModelValueType) => {
  reproYearRange.value = value
}

// 指摘1・指摘1(min/max)の未解決分を再現するための片側のみ選択状態。
// MonthPicker/YearPicker の handleUpdateSelectedDate は filter() で欠損側を取り除くため、
// 実際には 1 要素配列になり得るが、型は [T, T] | [] のタプルのため通常の呼び出しでは表現できない。
// 再現目的で意図的に型をすり抜けさせている。
const setMonthRangePartial = async (value: YearMonthValue[]) => {
  reproMonthRange.value = value as RangeMonthPickerModelValueType
}
const setYearRangePartial = async (value: number[]) => {
  reproYearRange.value = value as RangeYearPickerModelValueType
}

// DatePickerForm
const datePickerForm = ref<{ original: DatePickerModelValueType; input: DatePickerModelValueType }>({
  original: '2020/6',
  input: '2020/6',
})
const rangeDatePickerForm = ref<RangeDatePickerModelValueType>(['2026-06-01', '2026-07-31'])
const datePickerFormValid = ref<boolean>(false)
const isConfirmation = ref(false)
</script>

<template>
  <div>
    <v-form v-model="datePickerFormValid">
      <NovaInputGrid label="originalあり">
        <NovaDatePickerForm
          v-model="datePickerForm.input"
          :original="datePickerForm.original"
          :input-props="{
            maxDate: '2029/08/15',
            minDate: '2020/02/08',
            width: '180px',
          }"
          :is-confirmation="isConfirmation"
        >
          <template #explanation>{{ `original: ${datePickerForm.original}` }}</template>
        </NovaDatePickerForm>
      </NovaInputGrid>

      <NovaInputGrid :label="`range（original: ${['2026-06-01', '2026-07-31']}）`">
        <NovaDatePickerForm
          v-model="rangeDatePickerForm"
          :original="['2026-06-01', '2026-07-31']"
          :input-props="{ range: true, disabledDates, width: '250px' }"
          :is-confirmation="isConfirmation"
        />
      </NovaInputGrid>

      <NovaInputGrid required label="original なし">
        <NovaDatePickerForm
          v-model="datePickerForm.input"
          :input-props="{
            required: true,
            startDate: today,
          }"
          :is-confirmation="isConfirmation"
        >
          <template #explanation>{{ `入力値: ${datePickerForm.input}` }}</template>
        </NovaDatePickerForm>
      </NovaInputGrid>
      <NovaInputGrid label="disabled" required>
        <NovaDatePickerForm
          v-model="datePickerForm.input"
          :input-props="{
            disabled: true,
            required: true,
          }"
        />
      </NovaInputGrid>
      <v-btn :disabled="!datePickerFormValid" @click.stop="isConfirmation = !isConfirmation">
        formValid: {{ datePickerFormValid }} / isConfirmation: {{ isConfirmation }}
      </v-btn>
    </v-form>

    <CardContainer>
      <v-form v-model="formValid" @submit.prevent>
        <InputGrid label="日付選択(required)" required>
          <NovaDatePicker
            v-model="inputDate"
            required
            :start-date="today"
            min-date="2020/02/08"
            max-date="2029/08/15"
          />
          <div>{{ inputDate }}</div>
        </InputGrid>
        <InputGrid label="日付選択(range)" required>
          <NovaDatePicker v-model="inputDates" range required :disabled-dates="disabledDates" />
        </InputGrid>
        <InputGrid label="日付選択(range)">
          <NovaDatePicker v-model="inputDates" range :disabled-dates="disabledDates" />
        </InputGrid>
        <InputGrid label="日付選択(disabled)">
          <NovaDatePicker v-model="inputDate" disabled>
            <template #explanation>説明する説明する説明する説明する</template>
          </NovaDatePicker>
        </InputGrid>
        <InputGrid label="月選択（month-picker）" required>
          <NovaMonthPicker v-model="inputYearMonth" required>
            <template #explanation>説明する説明する説明する説明する</template>
          </NovaMonthPicker>
        </InputGrid>
        <InputGrid label="月選択（range）" required>
          <NovaMonthPicker
            v-model="inputYearMonths"
            required
            range
            :start-date="today"
            min-date="2020/02/08"
            max-date="2029/08/15"
          />
        </InputGrid>
        <InputGrid label="年選択（year-picker）required" required>
          <NovaYearPicker v-model="inputYear" required>
            <template #explanation>説明する説明する説明する説明する</template>
          </NovaYearPicker>
        </InputGrid>
        <InputGrid label="年選択（year-picker）">
          <NovaYearPicker v-model="inputYear" />
        </InputGrid>
        <InputGrid label="年選択（year-picker）range">
          <NovaYearPicker v-model="inputYears" range />
        </InputGrid>
      </v-form>
      <v-btn :disabled="disabled">click</v-btn>
    </CardContainer>

    <CardContainer>
      <div class="mb-6">
        <div class="text-h6 font-weight-bold">レビュー指摘の再現1</div>
        <div class="text-body-2">
          各ボタンで本来 invalid になる値を直接投入し、v-form の判定が valid のままになるか確認できる。
        </div>
        <div class="mt-2">v-form 判定: {{ validationText }} / model の valid フラグ: {{ reproFormValid }}</div>
      </div>

      <v-form v-model="reproFormValid" @submit.prevent>
        <InputGrid label="日付範囲 range required" required>
          <div class="demo-block">
            <NovaDatePicker v-model="reproDateRange" range required min-date="2020/02/08" max-date="2029/08/15" />
            <div class="button-row mt-3">
              <v-btn type="button" variant="outlined" size="small" @click="setDateRange(['2024-06-10', '2024-06-20'])">
                正常値
              </v-btn>
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                color="warning"
                @click="setDateRange(['2030-01-01', '2024-06-20'])"
              >
                開始日だけ max 超過
              </v-btn>
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                color="warning"
                @click="setDateRange(['2024-06-10', '2019-12-31'])"
              >
                終了日だけ min 未満
              </v-btn>
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                color="warning"
                @click="setDateRange(['2024-06-01', '2020-20'])"
              >
                不正値
              </v-btn>
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                color="error"
                @click="setDateRange(['2035-01-01', ''])"
              >
                片側のみ選択（開始日が max 超過 / 終了日未選択）
              </v-btn>
            </div>
            <div class="text-caption mt-2">現在値: {{ JSON.stringify(reproDateRange) }}</div>
          </div>
        </InputGrid>

        <InputGrid label="月範囲 range required" required>
          <div class="demo-block">
            <NovaMonthPicker v-model="reproMonthRange" range required min-date="2020/02/01" max-date="2029/08/01" />
            <div class="button-row mt-3">
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                @click="
                  setMonthRange([
                    { year: 2024, month: 5 },
                    { year: 2024, month: 6 },
                  ])
                "
              >
                正常値
              </v-btn>
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                color="warning"
                @click="
                  setMonthRange([
                    { year: 2025, month: 0 },
                    { year: 2024, month: 6 },
                  ])
                "
              >
                開始月だけ max 超過
              </v-btn>
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                color="warning"
                @click="
                  setMonthRange([
                    { year: 2024, month: 5 },
                    { year: 2019, month: 11 },
                  ])
                "
              >
                終了月だけ min 未満
              </v-btn>
              <v-btn
                type="button"
                variant="outlined"
                size="small"
                color="error"
                @click="setMonthRangePartial([{ year: 2035, month: 0 }])"
              >
                片側のみ選択（開始月が max 超過 / 終了月未選択）
              </v-btn>
            </div>
            <div class="text-caption mt-2">現在値: {{ JSON.stringify(reproMonthRange) }}</div>
          </div>
        </InputGrid>

        <InputGrid label="年範囲 range required" required>
          <div class="demo-block">
            <NovaYearPicker v-model="reproYearRange" range required :min="2012" :max="2020" />
            <div class="button-row mt-3">
              <v-btn type="button" variant="outlined" size="small" @click="setYearRange([2016, 2018])">正常値</v-btn>
              <v-btn type="button" variant="outlined" size="small" color="warning" @click="setYearRange([2021, 2018])">
                開始年だけ max 超過
              </v-btn>
              <v-btn type="button" variant="outlined" size="small" color="warning" @click="setYearRange([2016, 2011])">
                終了年だけ min 未満
              </v-btn>
              <v-btn type="button" variant="outlined" size="small" color="error" @click="setYearRangePartial([2035])">
                片側のみ選択（開始年が max 超過 / 終了年未選択）
              </v-btn>
            </div>
            <div class="text-caption mt-2">現在値: {{ JSON.stringify(reproYearRange) }}</div>
          </div>
        </InputGrid>
      </v-form>
    </CardContainer>

    <CardContainer>
      <div class="mb-6">
        <div class="text-h6 font-weight-bold">レビュー指摘の再現2</div>
        <div class="text-body-2">
          DatePicker と MonthPicker に同じ start-date を渡し、MonthPicker
          側だけ初期表示月が反映されないことを確認できる。
        </div>
      </div>

      <InputGrid label="指摘4: MonthPicker の start-date 転送漏れ">
        <div class="demo-block">
          <div class="text-body-2">
            両方とも start-date に {{ reproStartDate }} を指定している。DatePicker は指定月から開くが、MonthPicker
            は指定月から開かない。
          </div>
          <div class="mt-3 repro-grid">
            <div>
              <div class="text-subtitle-2 mb-2">比較用 DatePicker</div>
              <NovaDatePicker
                v-model="reproDateFromStartDate"
                :start-date="reproStartDate"
                min-date="2020/02/08"
                max-date="2036/12/31"
              />
            </div>
            <div>
              <div class="text-subtitle-2 mb-2">再現対象 MonthPicker</div>
              <NovaMonthPicker
                v-model="reproMonthFromStartDate"
                :start-date="reproStartDate"
                min-date="2020/02/08"
                max-date="2036/12/31"
              />
            </div>
          </div>
          <div class="text-caption mt-2">
            手順: どちらも未選択の状態でカレンダーを開き、初期表示月が 2035/12 になるか確認する。
          </div>
          <div class="text-caption">DatePicker の値: {{ JSON.stringify(reproDateFromStartDate) }}</div>
          <div class="text-caption">MonthPicker の値: {{ JSON.stringify(reproMonthFromStartDate) }}</div>
        </div>
      </InputGrid>
    </CardContainer>
  </div>
</template>

<style scoped lang="scss">
.demo-block {
  width: 100%;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.repro-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .repro-grid {
    grid-template-columns: 1fr;
  }
}
</style>
