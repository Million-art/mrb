import { useId } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useDispatch, useSelector } from "react-redux";
import { setSlippageTolerance, SLIPPAGE_TOLERANCE_OPTIONS } from "@/store/slice/swapSettingsSlice";
import { RootState } from "@/store/store";

// Ensuring that the input value corresponds to one of the SLIPPAGE_TOLERANCE_OPTIONS
const transformValue = (value: number) => value * 100;
const transformValueBack = (value: number) => value / 100;

const SlippageToleranceSection = () => {
  const dispatch = useDispatch();
  const slippageTolerance = useSelector((state: RootState) => state.swapSettings.slippageTolerance);

  const inputId = useId();

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = Number.parseFloat(e.target.value);
    const validValue = SLIPPAGE_TOLERANCE_OPTIONS.find(option => option === transformValueBack(parsedValue));

    if (validValue) {
      dispatch(setSlippageTolerance(validValue));
    } else {
      console.error("Invalid slippage tolerance value");
    }
  };

  return (
    <section className="flex flex-col space-y-4 items-center backdrop-blur-sm p-4 rounded-lg shadow-md">
      <div className="w-full">
        <Label htmlFor={inputId} className="text-gray-light text-lg font-semibold">Slippage Tolerance</Label>
        <Input
          id={inputId}
          type="number"
          value={transformValue(slippageTolerance)}
          onChange={handleSlippageChange}
          className="w-full p-2 mt-2  text-gray-light border border-gray-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-light"
        />
      </div>
      <div className="w-full flex space-x-2 justify-center">
        {SLIPPAGE_TOLERANCE_OPTIONS.map((value) => (
          <Button
            key={value}
            variant="default"
            onClick={() => dispatch(setSlippageTolerance(value))}
            className={`${
              value === slippageTolerance ? "bg-blue-DEFAULT text-white border-2 border-blue" : "bg-blue text-white"
            } py-2 px-4 rounded-full  transition duration-300`}
          >
            {transformValue(value)}%
          </Button>
        ))}
      </div>
    </section>
  );
};

export function SwapSettings({
  trigger = (
    <Button variant="outline" className="w-fit bg-gray-medium text-gray-light hover:bg-gray-dark py-2 px-4 rounded-md">
      Settings
    </Button>
  ),
}: {
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="backdrop-blur-sm text-gray-light rounded-lg p-6 max-w-xs mx-auto shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-light text-xl font-semibold mb-4">Swap Settings</DialogTitle>
        </DialogHeader>
        <SlippageToleranceSection />
      </DialogContent>
    </Dialog>
  );
}
