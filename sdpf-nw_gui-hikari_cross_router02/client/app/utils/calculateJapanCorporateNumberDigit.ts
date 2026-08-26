// 法人番号のチェックデジットを算出するメソッド(詳細は https://redmine.tok.access-company.com/nwvpn/issues/13747 参照)
export const calculateJapanCorporateNumberDigit = (value: string) => {
  return Array.from(value.slice(-12))
    .map(digit => 9 - Number(digit))
    .map((digit, index) => (index % 2 === 0 ? digit * 2 : digit))
    .reduce((acc, digit) => (acc + digit) % 9 || 9, 0) // チェックデジットは 9 で割り切れるときには 0 ではなく 9 になるため "|| 9" で置き換える
    .toString()
}
