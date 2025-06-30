CC ?= gcc
TOP = ..

CONCORD_DIR          = $(TOP)/concord
CONCORD_LIBDIR       = $(CONCORD_DIR)/lib
CONCORD_INCLUDEDIR   = $(CONCORD_DIR)/include
CONCORD_COREDIR	     = $(CONCORD_DIR)/core
CONCORD_GENCODECSDIR = $(CONCORD_DIR)/gencodecs

INCLUDEDIR = $(TOP)/include

CFLAGS  = -Wall -Wextra -O0 -g -I$(INCLUDEDIR)         \
          -I$(CONCORD_INCLUDEDIR) -I$(CONCORD_COREDIR) \
		  -I$(CONCORD_GENCODECSDIR)
LDFLAGS = -L$(CONCORD_LIBDIR)
LDLIBS  = -lcurl

OBJS = tccbot_context.o              \
       tccbot_dashboard.o            \
       tccbot_dashboard-events.o     \
       tccbot_interactions-handler.o

all: $(OBJS)

clean:
	@ rm -f $(OBJS)

.PHONY: all clean
