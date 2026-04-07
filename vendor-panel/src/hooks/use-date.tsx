import { format, formatDistance, sub } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"

import { languages } from "../i18n/languages"

// TODO: We rely on the current language to determine the date locale. This is not ideal, as we use en-US for the english translation.
// We either need to also have an en-GB translation or we need to separate the date locale from the translation language.
export const useDate = () => {
  const { i18n } = useTranslation()

  const locale =
    languages.find((l) => l.code === i18n.language)?.date_locale || enUS

  const toPHDate = (date: string | Date) => {
    return new Date(
      new Date(date).toLocaleString("en-US", {
        timeZone: "Asia/Manila",
      })
    )
  }

  const getFullDate = ({
    date,
    includeTime = false,
  }: {
    date: string | Date
    includeTime?: boolean
  }) => {
    const ensuredDate = toPHDate(date)

    if (isNaN(ensuredDate.getTime())) {
      return ""
    }

    const timeFormat = includeTime ? "p" : ""

    return format(ensuredDate, `PP ${timeFormat}`, {
      locale,
    })
  }

  const getShortDate = (date: string | Date) => {
    const ensuredDate = toPHDate(date)

    if (isNaN(ensuredDate.getTime())) {
      return ""
    }

    return format(ensuredDate, "d MMM yyyy", {
      locale,
    })
  }

  function getRelativeDate(date: string | Date): string {
    const now = toPHDate(new Date())

    return formatDistance(sub(toPHDate(date), { minutes: 0 }), now, {
      addSuffix: true,
      locale,
    })
  }

  return {
    getFullDate,
    getRelativeDate,
    getShortDate,
  }
}