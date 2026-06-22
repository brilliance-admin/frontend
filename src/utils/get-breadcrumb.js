import i18n from '/src/plugins/i18n'
import { detailUrl, categoryUrl, subDetailUrl } from '/src/api/schema'

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

    const subtab = route.query?.subtab
    const subcategorySchema = categorySchema.getTableInfo()?.subcategories?.[subtab]
    if (subcategorySchema) {
      path.push({
        to: `${url}?subtab=${subtab}`,
        title: `${subcategorySchema.title}`,
        viewname: route.params.viewname,
      })
    }
  }

  if (route.name === 'sub-detail') {
    const parentUrl = detailUrl(route.params.group, route.params.category, route.params.pk)
    path.push({
      to: categoryUrl(route.params.group, route.params.category),
      title: `${categorySchema.title}`,
      viewname: route.params.viewname,
    })
    path.push({
      to: parentUrl,
      title: `${categorySchema.title} #${route.params.pk}`,
      viewname: route.params.viewname,
      pk: route.params.pk,
    })

    const subDetailCategorySchema = categorySchema.getTableInfo()?.subcategories?.[route.params.subcategory]
    if (subDetailCategorySchema) {
      path.push({
        to: `${parentUrl}?subtab=${route.params.subcategory}`,
        title: `${subDetailCategorySchema.title}`,
        viewname: route.params.viewname,
      })

      const subDetailUrlValue = subDetailUrl(
        route.params.group,
        route.params.category,
        route.params.pk,
        route.params.subcategory,
        route.params.subpk,
      )
      path.push({
        to: subDetailUrlValue,
        title: `${subDetailCategorySchema.title} #${route.params.subpk}`,
        viewname: route.params.viewname,
        pk: route.params.subpk,
      })
    }
  }

  return path
}
