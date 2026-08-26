<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { basicInformationRefState, fieldSurveyRefState, constructionRefState, scrollToAnchor } = useGuarantees()
</script>

<template>
  <div class="flex-flex-start-center">
    <AnchorButton class="mr-3" :label="t('guarantees.basicInformation')" @click="scrollToAnchor(basicInformationRefState)" />
    <AnchorButton
      class="mr-3"
      :label="t('guarantees.fieldSurveyDetailsInformation')"
      @click="scrollToAnchor(fieldSurveyRefState)"
    />
    <AnchorButton
      :label="t('guarantees.constructionDetailsInformation')"
      @click="scrollToAnchor(constructionRefState)"
    />
  </div>
</template>
