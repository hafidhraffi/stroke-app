import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm, useWatch, type SubmitHandler } from "react-hook-form"
import api from "../../services/api";
import { useState } from "react";
import noImage from '../../../src/assets/no_image.png'
import { XCircleIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import toast from "react-hot-toast";

type ClassificationInputs = {
    patient_name: any;
    ct_img: FileList;
}

type SaveResultInputs = {
    diagnose: string;
    note: string;
}

function ClassificationPage() {
    const [ctImg, setCtImg] = useState<File>()

    const fetchProfile = async () => {
        const { data } = await api.get("/profile", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
        return data
    }

    const profile = useQuery({
        queryKey: ['profile'],
        queryFn: fetchProfile,
    })

    const fetchUsers = async () => {
        const { data } = await api.get("/doctor/get_users", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
        return data
    }

    const { data, isPending, isSuccess, isError, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        enabled: false
    })

    const classification = useMutation({
        mutationFn: async (formData: FormData) => {
            setCtImg(previewImg[0])
            const { data } = await api.post(`/predict`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
            });
            return data;
        },
    })

    const classificationForm = useForm<ClassificationInputs>()
    const saveResultForm = useForm<SaveResultInputs>()

    const onSubmit: SubmitHandler<ClassificationInputs> = (data) => {
        const formData = new FormData()
        formData.append("patient_name", data.patient_name)
        formData.append("ct_img", data.ct_img[0])

        classification.mutate(formData)
    }

    const optionLoadingTemplate = () => {
        return (
            <>
                {isPending && <Skeleton width="200px"></Skeleton>}
                {isError && <p>Tidak dapat mengambil data pengguna. Coba lagi nanti.</p>}
            </>
        );
    };

    const optionSuccessTemplate = (option) => {
        return (
            <>
                <p>{option.realname} ({option.username})</p>
            </>
        );
    };

    const valueTemplate = (value) => {
        if (value) {
            return (
                <>
                    <p>{value.realname} ({value.username})</p>
                </>
            );
        }
        return (
            <>
                <p>Pilih pasien</p>
            </>
        );
    };

    const onSaveSubmit: SubmitHandler<SaveResultInputs> = (saveResultData) => {
        toast.promise(
            saveMutation.mutateAsync(saveResultData),
            {
                loading: 'Menyimpan...',
                success: <b>Hasil klasifikasi berhasil disimpan!</b>,
                error: <b>Gagal menyimpan hasil klasifikasi. Mohon coba lagi nanti.</b>,
            }
        );
    }

    const saveMutation = useMutation({
        mutationFn: async (saveResultData: SaveResultInputs) => {
            const base64CtImg = await fileToBase64(ctImg!)
            const payload = {
                doctor_id: profile.data.id,
                patient_id: classificationForm.getValues("patient_name").id,
                ct_img: base64CtImg.split(",")[1],
                pred_resnet18: classification.data.pred_resnet18,
                pred_resnet50: classification.data.pred_resnet50,
                pred_customresnet: classification.data.pred_customresnet,
                gradcam_resnet18: classification.data.gradcam_resnet18,
                gradcam_resnet50: classification.data.gradcam_resnet50,
                gradcam_customresnet: classification.data.gradcam_customresnet,
                diagnose: saveResultData.diagnose,
                description: saveResultData.note,
            }
            const { data } = await api.post(`/save-result`, payload, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            return data;
        },
        onSuccess: () => {
            classificationForm.reset()
            classification.reset()
            saveResultForm.reset()
        }
    })

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () => {
                resolve(reader.result as string);
            };

            reader.onerror = (error) => {
                reject(error);
            };
        });
    };

    const previewImg = useWatch({ control: classificationForm.control, name: "ct_img" })

    const bleedingNote = "Model mendeteksi adanya indikasi perdarahan di dalam otak, yang dapat mengarah pada stroke Hemorrhagic. Heatmap menyoroti area yang diduga mengalami penumpukan darah abnormal. Penanganan medis darurat sangat diperlukan."
    const ischemiaNote = "Model mendeteksi kemungkinan adanya penurunan aliran darah atau penyumbatan pembuluh darah, yang dapat mengindikasikan stroke Ischemic. Heatmap menyoroti area otak yang dicurigai mengalami kelainan. Disarankan untuk segera melakukan pemeriksaan medis."
    const normalNote = "Model tidak mendeteksi adanya kelainan signifikan pada otak. Heatmap terlihat menyebar tanpa adanya fokus pada area tertentu, sehingga hasilnya cenderung normal. Namun, tetap disarankan untuk melakukan pemeriksaan klinis apabila gejala masih dirasakan."
    const diagnoseOptionTemplate = (option) => {
        return (
            <p>{option == "Bleeding" ? "Hemorrhagic" : option == "Ischemia" ? "Ischemic" : "Normal"}</p>
        );
    };

    return (
        <div className="flex flex-col max-[970px]:flex-col max-[970px]:items-center max-[970px]:gap-14 gap-10 max-md:text-sm max-sm:text-xs">
            <p className="text-3xl ml-10">Klasifikasi</p>
            <div className={`${classification.isIdle ? 'flex' : 'hidden'} flex-col gap-7 items-center min-[970px]:mt-10 mx-10`}>
                <form id="predict-form" className="flex flex-col gap-5 w-full max-w-200" onSubmit={classificationForm.handleSubmit(onSubmit)}>
                    <div className="flex max-sm:flex-col justify-between gap-5 max-sm:gap-1">
                        <label className="min-w-36 max-md:min-w-32">Username pasien <span className="text-red-500">*</span></label>
                        <div className="flex flex-col w-full max-w-150">
                            <Controller
                                name="patient_name"
                                control={classificationForm.control}
                                rules={{ required: "Username pasien wajib diisi" }}
                                render={({ field }) => (
                                    <Dropdown
                                        {...field}
                                        onShow={() => refetch()}
                                        options={data ?? [""]}
                                        optionLabel="realname"
                                        filter
                                        placeholder="Pilih pasien"
                                        itemTemplate={isSuccess ? optionSuccessTemplate : optionLoadingTemplate}
                                        valueTemplate={isSuccess ? valueTemplate : undefined}
                                        pt={{
                                            root: {
                                                className: "h-10 border-black! shadow-none!"
                                            },
                                            input: {
                                                className: "flex! py-0! items-center!"
                                            },
                                            filterInput: {
                                                className: "shadow-none! border border-black! focus:border-2!"
                                            }
                                        }}
                                    />
                                )}
                            />
                            {classificationForm.formState.errors.patient_name?.type === "required" && (
                                <p className="text-red-500" role="alert">Username pasien wajib diisi</p>
                            )}
                        </div>
                    </div>
                    <div className="flex max-sm:flex-col justify-between gap-5 max-sm:gap-1">
                        <label className="min-w-36 max-md:min-w-32">Gambar CT (PNG) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col w-full max-w-150">
                            <input className="border rounded h-10 file:bg-gray-300 file:h-full file:px-3" type="file" {...classificationForm.register("ct_img", { required: true })} />
                            {classificationForm.formState.errors.ct_img?.type === "required" && (
                                <p className="text-red-500" role="alert">Gambar CT wajib diisi</p>
                            )}
                            {previewImg && previewImg[0] ? <img src={URL.createObjectURL(previewImg[0])} className="h-24 w-24 rounded border mt-3" /> : <img src={noImage} className="h-24 w-24 rounded border mt-3" />}
                        </div>
                    </div>
                </form>
                <div className="flex gap-5 w-fit">
                    <button
                        form="predict-form"
                        className="border rounded px-3 py-2 text-white border-green-400 bg-green-500 hover:bg-green-400 active:scale-95 cursor-pointer"
                        type="submit"
                    >
                        Submit
                    </button>
                    <button
                        className="border rounded px-3 py-2 hover:bg-gray-200 active:scale-95 cursor-pointer"
                        onClick={() => {
                            classificationForm.reset()
                            classification.reset()
                        }}>
                        Reset
                    </button>
                </div>
            </div>
            {
                classification.isPending &&
                <div className="flex flex-col gap-5 justify-center">
                    <div className="flex gap-3 items-center">
                        <p>Pasien: </p>
                        <span className="font-bold">{classificationForm.getValues("patient_name").realname} ({classificationForm.getValues("patient_name").username})</span>
                    </div>
                    <div className="flex gap-3 items-center pointer">
                        <p>Dokter: </p>
                        <span className="font-bold">{profile.data.realname} ({profile.data.username})</span>
                    </div>
                    <div className="flex flex-wrap gap-5">
                        <div className="flex flex-col gap-3 items-center">
                            <p>Gambar CT</p>
                            <div className="w-40 h-40 max-[420px]:w-28 max-[420px]:h-28">
                                {ctImg && <img src={URL.createObjectURL(ctImg)} className="w-full h-full rounded" />}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <p>ResNet18</p>
                            <Skeleton className="w-40! h-40! max-[420px]:w-28! max-[420px]:h-28!"></Skeleton>
                            <Skeleton width="80px"></Skeleton>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <p>ResNet50</p>
                            <Skeleton className="w-40! h-40! max-[420px]:w-28! max-[420px]:h-28!"></Skeleton>
                            <Skeleton width="80px"></Skeleton>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <p>Custom ResNet</p>
                            <Skeleton className="w-40! h-40! max-[420px]:w-28! max-[420px]:h-28!"></Skeleton>
                            <Skeleton width="80px"></Skeleton>
                        </div>
                    </div>
                    <div className="max-w-200 text-justify">Catatan:<br></br>
                        <Skeleton className="mb-2"></Skeleton>
                        <Skeleton className="mb-2"></Skeleton>
                        <Skeleton width="160px"></Skeleton>
                    </div>
                </div>
            }
            {
                classification.isSuccess &&
                <div className="flex flex-col gap-5 justify-center mb-20">
                    <div className="flex gap-3 items-center">
                        <p>Pasien: </p>
                        <span className="font-bold">{classificationForm.getValues("patient_name").realname} ({classificationForm.getValues("patient_name").username})</span>
                    </div>
                    <div className="flex gap-3 items-center pointer">
                        <p>Dokter: </p>
                        <span className="font-bold">{profile.data.realname} ({profile.data.username})</span>
                    </div>
                    <div className="flex flex-wrap gap-5">
                        <div className="flex flex-col gap-3 items-center">
                            <p>Gambar CT</p>
                            <div className="w-40 h-40 max-[420px]:w-28 max-[420px]:h-28">
                                {ctImg && <img src={URL.createObjectURL(ctImg)} className="w-full h-full rounded" />}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <p>ResNet18</p>
                            <div className="w-40 max-[420px]:w-28">
                                <img
                                    className="w-full rounded"
                                    src={`data:image/png;base64,${classification.data.gradcam_resnet18}`}
                                    alt="CAM Heatmap"
                                />
                            </div>
                            <p className="font-semibold">{classification.data.pred_resnet18 == "Bleeding" ? "Hemorrhagic" : classification.data.pred_resnet18 == "Ischemia" ? "Ischemic" : "Normal"}</p>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <p>ResNet50</p>
                            <div className="w-40 max-[420px]:w-28">
                                <img
                                    className="w-full rounded"
                                    src={`data:image/png;base64,${classification.data.gradcam_resnet50}`}
                                    alt="Grad-CAM Heatmap"
                                />
                            </div>
                            <p className="font-semibold">{classification.data.pred_resnet50 == "Bleeding" ? "Hemorrhagic" : classification.data.pred_resnet50 == "Ischemia" ? "Ischemic" : "Normal"}</p>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <p>Custom ResNet</p>
                            <div className="w-40 max-[420px]:w-28">
                                <img
                                    className="w-full rounded"
                                    src={`data:image/png;base64,${classification.data.gradcam_customresnet}`}
                                    alt="Grad-CAM++ Heatmap"
                                />
                            </div>
                            <p className="font-semibold">{classification.data.pred_customresnet == "Bleeding" ? "Hemorrhagic" : classification.data.pred_customresnet == "Ischemia" ? "Ischemic" : "Normal"}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <p>Diagnosis: </p>
                        <Controller
                            name="diagnose"
                            control={saveResultForm.control}
                            rules={{ required: "Diagnosis dokter wajib diisi" }}
                            render={({ field }) => (
                                <Dropdown
                                    {...field}
                                    options={['Bleeding', 'Ischemia', 'Normal']}
                                    itemTemplate={diagnoseOptionTemplate}
                                    valueTemplate={diagnoseOptionTemplate}
                                    pt={{
                                        root: () => ({
                                            className: "h-10 border-black! shadow-none! cursor-default"
                                        }),
                                        input: {
                                            className: "flex! py-0! items-center! text-black!"
                                        }
                                    }}
                                />
                            )}
                        />
                        {saveResultForm.formState.errors.diagnose?.type === "required" && (
                            <p className="text-red-500" role="alert">Diagnosis dokter wajib diisi</p>
                        )}
                    </div>
                    <div className="text-justify">Catatan:<br></br>
                        <textarea
                            defaultValue={classification.data.pred_customresnet == "Bleeding" ? bleedingNote : classification.data.pred_customresnet == "Ischemia" ? ischemiaNote : normalNote}
                            className="px-3 py-2 border w-full rounded h-20"
                            {...saveResultForm.register("note")}
                        />
                    </div>
                    <div className="flex gap-5 justify-end mt-auto">
                        <button
                            className="border rounded px-3 py-2 hover:bg-gray-200 active:scale-95 cursor-pointer"
                            onClick={() => {
                                classification.reset()
                                saveResultForm.reset()
                            }}>
                            Kembali
                        </button>
                        <button
                            className="border border-green-400 rounded px-3 py-2 bg-green-500 hover:bg-green-400 text-white active:scale-95 cursor-pointer"
                            onClick={saveResultForm.handleSubmit(onSaveSubmit)}>
                            Simpan
                        </button>
                    </div>
                </div>
            }
            {
                classification.isError &&
                <div className="flex items-center">
                    <div className='text-sm max-md:text-xs flex gap-3 items-center h-fit bg-red-100 w-fit py-1 px-3 rounded border border-red-600 text-red-600'>
                        <XCircleIcon className='h-5 shrink-0' />
                        <p>Tidak dapat terhubung ke server. Mohon coba lagi nanti.</p>
                    </div>
                </div>
            }
        </div>
    )
}

export default ClassificationPage