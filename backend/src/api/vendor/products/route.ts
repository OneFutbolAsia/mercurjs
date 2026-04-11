import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req, res) => {
  try {
    console.log("========================================")
    console.log("🔥 /vendor/products HIT")
    console.log("QUERY PARAMS:", req.query)
    console.log("FILTERABLE FIELDS (RAW):", req.filterableFields)
    console.log("========================================")

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const search = req.query.q

    // 🔥 Helper
    const normalizeToArray = (value: any) => {
      if (!value) return value
      if (Array.isArray(value)) return value
      if (typeof value === "string") return value.split(",")
      return value
    }

    // 🔥 START CLEAN
    const filters: any = {}

    // 🔥 Copy ONLY VALID fields (exclude seller_id)
    Object.entries(req.filterableFields || {}).forEach(([key, value]) => {
      if (key === "seller_id") {
        console.log("🚫 Skipping seller_id (not a DB column)")
        return
      }
      filters[key] = value
    })

    // 🔥 Normalize array fields
    const arrayFields = [
      "collection_id",
      "category_id",
      "status",
      "type_id",
      "tag_id",
    ]

    arrayFields.forEach((key) => {
      if (filters[key]) {
        filters[key] = normalizeToArray(filters[key])
      }
    })

    // 🔥 FORCE status fix (critical)
    if (req.query.status && typeof req.query.status === "string") {
      filters.status = [req.query.status]
    }

    // 🔥 Search
    if (search) {
      console.log("👉 Applying search:", search)

      filters.$and = filters.$and || []

      filters.$and.push({
        $or: [
          { title: { $ilike: `%${search}%` } },
          { handle: { $ilike: `%${search}%` } },
        ],
      })
    }

    console.log("========================================")
    console.log("FINAL FILTERS (SAFE):", JSON.stringify(filters, null, 2))
    console.log("========================================")

    // ✅ Pagination
    const skip = req.queryConfig?.pagination?.skip || 0
    const take = req.queryConfig?.pagination?.take || 10
    const order = req.queryConfig?.pagination?.order

    const pagination: any = { skip, take }
    if (order) pagination.order = order

    console.log("👉 Pagination:", pagination)

    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: req.queryConfig.fields,
      filters,
      pagination,
    })

    console.log("========================================")
    console.log("✅ RESULT COUNT:", metadata?.count)
    console.log("========================================")

    res.json({
      products,
      count: metadata?.count || products.length,
      offset: skip,
      limit: take,
    })
  } catch (error) {
    console.error("❌ ERROR in /vendor/products:", error)

    res.status(500).json({
      message: "Failed to fetch vendor products",
      error: error.message,
    })
  }
}