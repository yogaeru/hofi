interface HofiEnv {
  helperAur: "paru" | "yay" | "pikaur" | null;
  isFlatpak: boolean;
}

const env: HofiEnv = {
  isFlatpak: false,
  helperAur: null,
};

export function getHofiEnv<K extends keyof HofiEnv>(key: K): HofiEnv[K] {
  return env[key];
}

export function getHofiEnvObject(): HofiEnv {
  return env;
} 

export function setHofiEnv<K extends keyof HofiEnv>(
  key: K,
  value: HofiEnv[K],
): void {
  env[key] = value;
}
