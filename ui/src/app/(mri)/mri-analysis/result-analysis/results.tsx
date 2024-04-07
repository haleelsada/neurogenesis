import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileIcon } from "lucide-react"
import Image from "next/image"
import { useCallback, useMemo, useState } from "react"
import Dropzone, { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { useChat, useCompletion } from "ai/react"

const baseStyle = {
  height: "185px",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "rgb(3 7 68/ var(--tw-bg-opacity))",
  borderStyle: "dashed",
  backgroundColor: "rgb(3 7 18/ var(--tw-bg-opacity))",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
}

const focusedStyle = {
  borderColor: "#2196f3",
}

const acceptStyle = {
  borderColor: "#00e676",
}

const rejectStyle = {
  borderColor: "#ff1744",
}

const formSchema = z.object({
  identifier: z.string(),
  img: z.instanceof(File),
})

export function ResultAnalysis() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      img: null,
    },
  })

  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
    acceptedFiles,
  } = useDropzone({ accept: { "image/*": [] } })

  const [result, setResult] = useState("")

  const makeApiReq = useCallback(async function (fd: FormData) {
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        body: fd,
      })

      if (!res.ok) {
        throw new Error("Failed to fetch")
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (reader) {
        let accumulator = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = new TextDecoder().decode(value)
          accumulator += text
          setResult(accumulator)
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setResult(`Error: ${error.message}`)
      }
    }
  }, [])

  async function onsubmitImg(data: z.infer<typeof formSchema>) {
    // post img to /completions

    console.log({ data })

    const fd = new FormData()

    fd.append("identifier", data.identifier)

    fd.append("img", data.img)

    makeApiReq(fd)
  }

  return (
    <div className="bg-white dark:bg-gray-950 dark:text-gray-50 w-full shadow-sm">
      <div className="container mx-auto flex flex-col">
        <div className="container mx-auto space-y-3 p-4 flex flex-col">
          <Form {...form}>
            <form
              onSubmit={
                // @ts-ignore
                form.handleSubmit(onsubmitImg)
              }
              className="space-y-2"
            >
              <div>
                <p>Upload a medical scan or result to understand it better.</p>

                <div className="w-fit">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="name">Identifier</FormLabel>
                        <FormControl>
                          <Input
                            id="name"
                            placeholder="Enter Identifier"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <section>
                  <FormField
                    control={form.control}
                    name="img"
                    render={({ field }) => (
                      <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center gap-2">
                        <FileIcon className="w-12 h-12 text-gray-300" />
                        <span className="text-sm text-gray-500">
                          Drag and drop your file here
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          {...getRootProps({
                            onClick: (e) => e.preventDefault(),
                          })}
                        >
                          Select File
                          <FormItem>
                            <FormControl>
                              <Input
                                className="absolute inset-0 opacity-0 w-full cursor-pointer"
                                type="file"
                                {...getInputProps({
                                  onChange: (e) => {
                                    field.onChange(e.target.files?.[0])
                                  },
                                })}
                              />
                            </FormControl>
                          </FormItem>
                        </Button>
                      </div>
                    )}
                  />
                  {/* <DropzoneStyled /> */}
                </section>
              </div>

              {acceptedFiles.length > 0 && (
                <div>
                  {acceptedFiles.map((file, i) => (
                    <div className="flex items-center gap-4" key={i}>
                      <Image
                        alt="Thumbnail"
                        className="rounded"
                        height="40"
                        src="/placeholder.svg"
                        style={{
                          aspectRatio: "40/40",
                          objectFit: "cover",
                        }}
                        width="40"
                      />
                      <div className="text-sm leading-none">
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-gray-500">
                          {file.size} bytes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="self-center">
                <Button type="submit">Get Analysis</Button>
              </div>
            </form>
          </Form>
        </div>
        <div className="p-4">
          <h1 className="text-xl">Results:</h1>

          <div className="border rounded-lg dark:bg-gray-950 dark:text-gray-50 p-4 border-opacity-5">
            <p>Results will be displayed here.</p>
            <p>{result}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
