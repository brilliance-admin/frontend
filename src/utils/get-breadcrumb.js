import i18n from '/src/plugins/i18n'
import { detailUrl, categoryUrl } from '/src/api/schema'

export function getBreadcrumbs(adminSchema, router, route) {
  let path = []

  path.unshift({
    title: i18n.global.t('navigation'),
    to: '/navigation',
  })

  const categorySchema = adminSchema.get_category(route.params.group, route.params.category)
  if (!categorySchema) return path

  if (route.name === 'category' || route.name === 'detail') {
    let url = categoryUrl(route.params.group, route.params.category)
    path.push({
      to: url,
      title: `${categorySchema.title}`,
      viewname: route.params.viewname,
    })
  }

  if (route.name === 'detail') {
    let url = detailUrl(route.params.group, route.params.category, route.params.pk)
    path.push({
      to: url,
      title: `${categorySchema.title} #${route.params.pk}`,
      viewname: route.params.viewname,
      pk: route.params.pk,
    })
  }

  return path
}
