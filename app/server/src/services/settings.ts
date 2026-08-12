const settingsByShop = new Map<string, { defaultThreshold: number }>()

export function getSettings(shopId: string) {
  return settingsByShop.get(shopId) ?? { defaultThreshold: 70 }
}

export function updateSettings(shopId: string, defaultThreshold: number) {
  const settings = { defaultThreshold }
  settingsByShop.set(shopId, settings)
  return settings
}
