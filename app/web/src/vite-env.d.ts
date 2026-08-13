/// <reference types="vite/client" />

interface ResourcePickerProduct {
  id: string
  title: string
  variants?: Array<{ id: string }>
}

declare const shopify: {
  idToken: () => Promise<string>
  resourcePicker: (options: {
    type: 'product'
    multiple?: boolean
    action?: string
  }) => Promise<ResourcePickerProduct[] | undefined>
}
