import { useMutation } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import api from "../services/api";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useContext } from "react";
import { RoleContext } from "../context/RoleContext";
import { jwtDecode } from "jwt-decode";
import type { TokenPayload } from "../provider/RoleProvider";

type LoginInputs = {
    email: string;
    password: string;
}

function LoginPage() {
    const { setCurrentRole } = useContext(RoleContext)!
    const navigate = useNavigate()
    const {
        register,
        formState: { errors },
        handleSubmit
    } = useForm<LoginInputs>()
    const onSubmit: SubmitHandler<LoginInputs> = (data) => {
        toast.promise(
            mutation.mutateAsync(data),
            {
                loading: 'Mohon tunggu...',
                success: (response) => <b>Selamat datang, {response.name}</b>,
                error: <b>Login gagal. Mohon coba lagi nanti.</b>,
            }
        );
    }

    const mutation = useMutation({
        mutationFn: async (formData: LoginInputs) => {
            const { data } = await api.post(`/login`, formData);
            return data;
        },
        onSuccess: (response) => {
            localStorage.setItem("token", response.access_token)
            const role = jwtDecode<TokenPayload>(response.access_token).role
            setCurrentRole(role)
            navigate("/")
        }
    })

    return (
        <>
            <div className="flex flex-col items-center">
                <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 w-full max-w-100 items-center px-5">
                    <p className="w-full text-2xl font-semibold mt-20">Login</p>
                    <div className="flex flex-col w-full">
                        <label>Email</label>
                        <input type="email" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("email", { required: "Email wajib diisi" })} />
                        {errors.email && <p className="text-red-500" role="alert">{errors.email.message}</p>}
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Password</label>
                        <input type="password" className="h-8 rounded border border-black focus:outline-none focus:border-2 px-1" {...register("password", { required: "Password wajib diisi", minLength: { value: 8, message: "Password harus terdapat minimal 8 karakter" } })} />
                        {errors.password && <p className="text-red-500" role="alert">{errors.password.message}</p>}
                    </div>
                    <button disabled={mutation.isPending} className="border w-full mt-2 rounded px-3 py-2 text-white border-green-400 bg-green-500 hover:bg-green-400 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400 disabled:border-gray-400">Login</button>
                </form>
            </div>
        </>
    )
}

export default LoginPage