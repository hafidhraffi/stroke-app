import { Dialog } from "primereact/dialog"
import { type Dispatch, type SetStateAction } from "react";

function LogDetail({
    detailVisible,
    setDetailVisible,
    selectedLogData }: {
        detailVisible: boolean;
        setDetailVisible: Dispatch<SetStateAction<boolean>>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectedLogData: any;
    }) {

    return (
        <>
            <Dialog
                header="Detail Log"
                visible={detailVisible}
                style={{ width: "90vw", maxWidth: "800px" }}
                onHide={() => {
                    setDetailVisible(false)
                }}
            >
                {selectedLogData &&
                    <div className="max-sm:px-1 px-10">
                        <div className="grid grid-cols-3 mb-2 gap-2">
                            <p>Pasien</p>
                            <div className="flex col-span-2">
                                <p>:&nbsp;</p>
                                <p>{selectedLogData.patient_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 mb-2 gap-2">
                            <p>Dokter</p>
                            <div className="flex col-span-2">
                                <p>:&nbsp;</p>
                                <p>{selectedLogData.doctor_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 mb-2 gap-2">
                            <p>Diagnosis</p>
                            <div className="flex col-span-2">
                                <p>:&nbsp;</p>
                                {
                                    selectedLogData.diagnose == "Bleeding" && <p>Hemorrhagic</p>
                                }
                                {
                                    selectedLogData.diagnose == "Ischemia" && <p>Ischemic</p>
                                }
                                {
                                    selectedLogData.diagnose == "Normal" && <p>Normal</p>
                                }
                            </div>
                        </div>
                        <div className="grid grid-cols-3 mb-2 gap-2">
                            <p>Catatan</p>
                            <div className="flex col-span-2">
                                <p>:&nbsp;</p>
                                <p>{selectedLogData.description}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 mb-2 gap-2">
                            <p>Tanggal</p>
                            <div className="flex col-span-2">
                                <p>:&nbsp;</p>
                                <p>{selectedLogData.timestamp}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-5">
                            <div className="flex flex-col gap-3 items-center">
                                <p>Gambar CT</p>
                                <div className="w-28 h-28">
                                    <img
                                        className="w-full rounded h-full"
                                        src={`data:image/png;base64,${selectedLogData.ct_img}`}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 items-center">
                                <p>ResNet18</p>
                                <div className="w-28 h-28">
                                    <img
                                        className="w-full rounded"
                                        src={`data:image/png;base64,${selectedLogData.gradcam_resnet18}`}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 items-center">
                                <p>ResNet50</p>
                                <div className="w-28 h-28">
                                    <img
                                        className="w-full rounded"
                                        src={`data:image/png;base64,${selectedLogData.gradcam_resnet50}`}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 items-center">
                                <p>Custom ResNet</p>
                                <div className="w-28 h-28">
                                    <img
                                        className="w-full rounded"
                                        src={`data:image/png;base64,${selectedLogData.gradcam_customresnet}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </Dialog >
        </>
    )
}

export default LogDetail