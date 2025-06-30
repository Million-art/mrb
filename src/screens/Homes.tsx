import CryptoAnalyzer from "../components/home/CryptoAnalayzer"
import HeaderSetting from "@/components/home/HeaderSetting"


export const Homes = () => {
  return (
    <main className="flex flex-col h-auto  ">
      <HeaderSetting />
      <CryptoAnalyzer />
       
    </main>
  )
}
