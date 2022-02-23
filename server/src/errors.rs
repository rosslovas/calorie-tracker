use std::error::Error as StdError;
use std::ops::{Deref, DerefMut};

use rocket::{http::Status, response, response::Responder, Request};
use simple_error::SimpleError;

pub struct Error(SimpleError);

impl Error {
    pub fn new<S: AsRef<str>>(message: S) -> Self {
        Error(message.as_ref().into())
    }

    pub fn err<T, S: AsRef<str>>(message: S) -> Result<T, Self> {
        Err(Error(message.as_ref().into()))
    }
}

impl Deref for Error {
    type Target = SimpleError;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Error {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T> From<T> for Error
where
    T: StdError,
{
    fn from(err: T) -> Self {
        Error::new(err.to_string())
    }
}

pub trait OptionOkOrErr<T> {
    fn ok_or_err<S: AsRef<str>>(self, message: S) -> Result<T, Error>;
}

impl<T> OptionOkOrErr<T> for Option<T> {
    fn ok_or_err<S: AsRef<str>>(self, message: S) -> Result<T, Error> {
        self.ok_or_else(|| Error::new(message))
    }
}

pub trait ResultRemapErr<T, E> {
    fn remap_err(self) -> Result<T, Error>;
}

impl<T, E> ResultRemapErr<T, E> for Result<T, E>
where
    E: StdError,
{
    fn remap_err(self) -> Result<T, Error> {
        self.map_err(Error::from)
    }
}

impl<'r> Responder<'r, 'static> for Error {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        eprintln!("Internal server error: {}", self.to_string());
        Err(Status::InternalServerError)
    }
}
