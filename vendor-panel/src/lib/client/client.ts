import Medusa from "@medusajs/js-sdk"

export const backendUrl = __BACKEND_URL__ ?? "/"
export const publishableApiKey = __PUBLISHABLE_API_KEY__ ?? ""

const token = window.localStorage.getItem("medusa_auth_token") || ""

export const sdk = new Medusa({
  baseUrl: backendUrl,
  publishableKey: publishableApiKey,
})

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== "undefined") {
  ;(window as any).__sdk = sdk
}

export const importProductsQuery = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  return await fetch(`${backendUrl}/vendor/products/import`, {
    method: "POST",
    body: formData,
    headers: {
      authorization: `Bearer ${token}`,
      "x-publishable-api-key": publishableApiKey,
    },
  })
    .then((res) => res.json())
    .catch(() => null)
}

export const uploadFilesQuery = async (files: any[]) => {
  const formData = new FormData()

  for (const { file } of files) {
    formData.append("files", file)
  }

  return await fetch(`${backendUrl}/vendor/uploads`, {
    method: "POST",
    body: formData,
    headers: {
      authorization: `Bearer ${token}`,
      "x-publishable-api-key": publishableApiKey,
    },
  })
    .then((res) => res.json())
    .catch(() => null)
}

export const fetchQuery = async (
  url: string,
  {
    method,
    body,
    query,
    headers,
  }: {
    method: "GET" | "POST" | "DELETE"
    body?: object
    query?: Record<string, string | number>
    headers?: { [key: string]: string }
  }
) => {
  const bearer = (await window.localStorage.getItem("medusa_auth_token")) || ""

  const queryToProcess = query ? { ...query } : {}

  // Medusa 2.0 Mapping: Rename 'order' to 'order_by'
  if (queryToProcess.order) {
    queryToProcess.order_by = queryToProcess.order
    delete queryToProcess.order
  }

  const params = new URLSearchParams()

  Object.entries(queryToProcess).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return

    if (Array.isArray(value)) {
      // Medusa 2.0 often requires 'key[]' format for the backend to parse as array
      value.forEach((v) => {
        if (v !== undefined && v !== null) {
          params.append(`${key}[]`, String(v))
        }
      })
    } else if (key === "status") {
      // FORCE status to be an array format even if it's a single string
      // This fixes the "Expected type: 'array' for field 'status'" error
      params.append(`${key}[]`, String(value))
    } else {
      params.append(key, String(value))
    }
  })

  const queryString = params.toString()

  const response = await fetch(
    `${backendUrl}${url}${queryString ? `?${queryString}` : ""}`,
    {
      method: method,
      headers: {
        authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableApiKey,
        ...headers,
      },
      body: body ? JSON.stringify(body) : null,
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Nieznany błąd serwera")
  }

  return response.json()
}
