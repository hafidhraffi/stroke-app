import { Bars3Icon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/20/solid'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { RoleContext } from '../context/RoleContext'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

function Menu() {
    const navigate = useNavigate()
    const [menuVisible, setMenuVisible] = useState<boolean>(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { currentRole, setCurrentRole } = useContext(RoleContext)!

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuVisible(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const fetchProfile = async () => {
        const { data } = await api.get("/profile", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
        return data
    }

    const { data } = useQuery({
        queryKey: ['profile'],
        queryFn: fetchProfile,
    })

    return (
        <div ref={menuRef} className='relative flex flex-col items-end mt-10 mx-10 z-20'>
            <Bars3Icon
                onClick={() => setMenuVisible(!menuVisible)}
                className='h-6 cursor-pointer active:scale-95'
            />
            {
                menuVisible &&
                <div className='bg-white min-w-28 w-max py-1 border rounded absolute top-6'>
                    <div className='flex mr-2 ml-1 mb-1 items-center gap-1'>
                        <UserCircleIcon className='h-14' />
                        {
                            data &&
                            <div>
                                <p className='text-sm font-semibold'>{`${data.username} (${data.role})`}</p>
                                <p className='text-sm'>{data.realname}</p>
                                <p className='text-xs'>{data.email}</p>
                            </div>
                        }
                    </div>
                    <hr />
                    {
                        currentRole == "doctor" &&
                        <>
                            <div
                                onClick={() => {
                                    setMenuVisible(false)
                                    navigate("/")
                                }}
                                className='cursor-pointer hover:bg-gray-200 py-1 px-5'
                            >
                                Log
                            </div>
                            <div
                                onClick={() => {
                                    setMenuVisible(false)
                                    navigate("/classification")
                                }}
                                className='cursor-pointer hover:bg-gray-200 py-1 px-5'
                            >
                                Klasifikasi
                            </div>
                            <hr />

                        </>
                    }
                    {
                        currentRole == "admin" &&
                        <>
                            <div
                                onClick={() => {
                                    setMenuVisible(false)
                                    navigate("/")
                                }}
                                className='cursor-pointer hover:bg-gray-200 py-1 px-5'
                            >
                                Log
                            </div>
                            <div
                                onClick={() => {
                                    setMenuVisible(false)
                                    navigate("/create-account")
                                }}
                                className='cursor-pointer hover:bg-gray-200 py-1 px-5'
                            >
                                Buat Akun
                            </div>
                            <hr />
                        </>
                    }
                    {
                        currentRole == "user" &&
                        <>
                            <div
                                onClick={() => {
                                    setMenuVisible(false)
                                    navigate("/")
                                }}
                                className='cursor-pointer hover:bg-gray-200 py-1 px-5'
                            >
                                Log
                            </div>
                            <hr />
                        </>
                    }
                    <div className='flex justify-end'>
                        <button onClick={() => {
                            localStorage.removeItem("token")
                            setCurrentRole(null)
                            navigate("/login")
                        }} className='flex mx-2 my-1 items-center gap-1 cursor-pointer bg-red-500 text-white p-1 mt-2 rounded active:scale-95 hover:bg-red-600'>
                            <ArrowRightStartOnRectangleIcon className='h-5' />
                            <p className='text-sm'>Logout</p>
                        </button>
                    </div>
                </div>
            }
        </div>
    )
}

export default Menu