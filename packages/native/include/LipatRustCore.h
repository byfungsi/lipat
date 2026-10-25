#ifndef LIPAT_NATIVE_H
#define LIPAT_NATIVE_H
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif
uint32_t lipat_native_abi_version(void);
/* Input is borrowed for this call. Free the owned UTF-8 JSON response once with lipat_native_free. */
char *lipat_native_execute(const uint8_t *input, size_t length);
void lipat_native_free(char *response);
#ifdef __cplusplus
}
#endif
#endif
