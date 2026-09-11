#include <arpa/inet.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#include "mixer.h"

#define MAX_TEST_CLIENTS 5

extern int g_oscfd;
extern struct sockaddr_in g_oscClient[MAX_TEST_CLIENTS];

int main(int argc, char** argv) {
    if (argc != 3)
        return 2;

    for (int i = 0; i < MAX_TEST_CLIENTS; ++i) {
        memset(&g_oscClient[i], 0, sizeof(g_oscClient[i]));
        g_oscClient[i].sin_family = AF_INET;
#ifdef __APPLE__
        g_oscClient[i].sin_len = sizeof(g_oscClient[i]);
#endif
    }

    uint16_t first_port = (uint16_t)strtoul(argv[1], NULL, 10);
    uint16_t second_port = (uint16_t)strtoul(argv[2], NULL, 10);
    if (addOscClient("127.0.0.1", first_port) < 0 ||
        addOscClient("127.0.0.1", second_port) < 0)
        return 3;

    g_oscfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (g_oscfd < 0)
        return 4;

    setLevel(0, 0.5f);
    usleep(20000);
    removeOscClient("127.0.0.1", first_port);
    setBalance(0, 0.25f);
    usleep(20000);
    close(g_oscfd);
    return 0;
}
